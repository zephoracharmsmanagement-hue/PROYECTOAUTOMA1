import 'server-only';

import type Stripe from 'stripe';
import { getStripe, METADATA_KEYS } from '@/lib/stripe/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { Json } from '@/types/database.types';

/**
 * Manejadores del webhook de Stripe.
 *
 * Este modulo es la UNICA via por la que se conceden o revocan entitlements.
 * Ni la pagina de exito ni ninguna accion de cliente otorgan acceso: el usuario
 * puede cerrar el navegador antes del redirect y el pago igualmente debe
 * reflejarse.
 *
 * Todas las operaciones son idempotentes: Stripe reintenta y puede entregar el
 * mismo evento varias veces o desordenado.
 */

type Admin = ReturnType<typeof createSupabaseAdminClient>;

/** Estados de Stripe que mantienen viva la membresia. */
const GRANTING_STATUSES = new Set(['active', 'trialing', 'past_due']);

/** Registra el evento; devuelve false si ya se habia procesado. */
export async function claimEvent(admin: Admin, event: Stripe.Event): Promise<boolean> {
  const { error } = await admin.from('webhook_events').insert({
    stripe_event_id: event.id,
    type: event.type,
    payload: event.data.object as unknown as Json,
  });

  if (!error) return true;

  // 23505 = unique_violation -> el evento ya estaba registrado.
  if ((error as { code?: string }).code === '23505') {
    logger.info('Evento de Stripe duplicado, se ignora', { eventId: event.id, type: event.type });
    return false;
  }

  throw new Error(`No se pudo registrar el evento ${event.id}: ${error.message}`);
}

/** Resuelve el usuario a partir de la metadata o, en su defecto, del customer. */
async function resolveUserId(
  admin: Admin,
  metadata: Stripe.Metadata | null | undefined,
  customerId: string | null,
): Promise<string | null> {
  const fromMetadata = metadata?.[METADATA_KEYS.userId];
  if (fromMetadata) return fromMetadata;

  if (!customerId) return null;

  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return data?.id ?? null;
}

function customerIdOf(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

// -----------------------------------------------------------------------------
// Compra de pago unico
// -----------------------------------------------------------------------------

async function handleOneTimePurchase(admin: Admin, session: Stripe.Checkout.Session) {
  const userId = await resolveUserId(admin, session.metadata, customerIdOf(session.customer));
  const packageId = session.metadata?.[METADATA_KEYS.packageId] ?? null;

  if (!userId || !packageId) {
    logger.error('Checkout de pago unico sin metadata suficiente', {
      sessionId: session.id,
      userId,
      packageId,
    });
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  // La orden se identifica por la sesion de checkout: reintentos no duplican.
  const { data: order, error: orderError } = await admin
    .from('orders')
    .upsert(
      {
        user_id: userId,
        package_id: packageId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? 'usd',
        status: 'paid',
      },
      { onConflict: 'stripe_checkout_session_id' },
    )
    .select('id')
    .single();

  if (orderError) throw new Error(`No se pudo registrar la orden: ${orderError.message}`);

  const { error: entitlementError } = await admin.from('entitlements').upsert(
    {
      user_id: userId,
      kind: 'package',
      package_id: packageId,
      source: 'purchase',
      status: 'active',
      order_id: order.id,
      // Compra vitalicia: sin caducidad.
      expires_at: null,
    },
    { onConflict: 'user_id,package_id' },
  );

  if (entitlementError) {
    throw new Error(`No se pudo conceder el acceso al paquete: ${entitlementError.message}`);
  }

  logger.info('Acceso a paquete concedido', { userId, packageId, orderId: order.id });
}

// -----------------------------------------------------------------------------
// Suscripcion all-access
// -----------------------------------------------------------------------------

export async function syncSubscription(admin: Admin, subscription: Stripe.Subscription) {
  const customerId = customerIdOf(subscription.customer);
  const userId = await resolveUserId(admin, subscription.metadata, customerId);

  if (!userId) {
    logger.error('Suscripcion sin usuario resoluble', {
      subscriptionId: subscription.id,
      customerId,
    });
    return;
  }

  const priceId = subscription.items.data[0]?.price.id ?? null;

  // Enlaza con el plan local por price id; si no existe, se guarda igualmente.
  const { data: plan } = priceId
    ? await admin.from('plans').select('id').eq('stripe_price_id', priceId).maybeSingle()
    : { data: null };

  const { data: row, error } = await admin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_id: plan?.id ?? null,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      { onConflict: 'stripe_subscription_id' },
    )
    .select('id')
    .single();

  if (error) throw new Error(`No se pudo sincronizar la suscripcion: ${error.message}`);

  const grants = GRANTING_STATUSES.has(subscription.status);

  const { error: entitlementError } = await admin.from('entitlements').upsert(
    {
      user_id: userId,
      kind: 'all_access',
      package_id: null,
      source: 'subscription',
      status: grants ? 'active' : 'revoked',
      subscription_id: row.id,
      // Colchon: el acceso sobrevive hasta el fin del periodo pagado aunque un
      // evento posterior llegue tarde.
      expires_at: grants ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    },
    { onConflict: 'user_id' },
  );

  if (entitlementError) {
    throw new Error(`No se pudo actualizar la membresia: ${entitlementError.message}`);
  }

  logger.info('Suscripcion sincronizada', {
    userId,
    subscriptionId: subscription.id,
    status: subscription.status,
    grants,
  });
}

async function revokeSubscription(admin: Admin, subscription: Stripe.Subscription) {
  const { error } = await admin
    .from('subscriptions')
    .update({ status: subscription.status, cancel_at_period_end: false })
    .eq('stripe_subscription_id', subscription.id);

  if (error) logger.error('No se pudo marcar la suscripcion cancelada', { error: error.message });

  const userId = await resolveUserId(
    admin,
    subscription.metadata,
    customerIdOf(subscription.customer),
  );
  if (!userId) return;

  await admin
    .from('entitlements')
    .update({ status: 'revoked' })
    .eq('user_id', userId)
    .eq('kind', 'all_access');

  logger.info('Membresia revocada', { userId, subscriptionId: subscription.id });
}

// -----------------------------------------------------------------------------
// Reembolsos y disputas
// -----------------------------------------------------------------------------

async function revokeForCharge(admin: Admin, charge: Stripe.Charge, reason: string) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);

  if (!paymentIntentId) return;

  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, package_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (!order) return;

  await admin.from('orders').update({ status: 'refunded' }).eq('id', order.id);

  if (order.package_id) {
    await admin
      .from('entitlements')
      .update({ status: 'revoked' })
      .eq('user_id', order.user_id)
      .eq('kind', 'package')
      .eq('package_id', order.package_id);
  }

  logger.info('Acceso revocado por reembolso o disputa', { orderId: order.id, reason });
}

// -----------------------------------------------------------------------------
// Router de eventos
// -----------------------------------------------------------------------------

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  const admin = createSupabaseAdminClient();

  const isNew = await claimEvent(admin, event);
  if (!isNew) return;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      if (session.payment_status === 'unpaid') return;

      if (session.mode === 'payment') {
        await handleOneTimePurchase(admin, session);
      } else if (session.mode === 'subscription' && session.subscription) {
        // Se recupera la suscripcion completa: la sesion solo trae el id.
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await syncSubscription(admin, subscription);
      }
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncSubscription(admin, event.data.object);
      return;

    case 'customer.subscription.deleted':
      await revokeSubscription(admin, event.data.object);
      return;

    case 'invoice.payment_failed':
      logger.warn('Pago de factura fallido', {
        invoiceId: event.data.object.id,
        customerId: customerIdOf(event.data.object.customer),
      });
      return;

    case 'charge.refunded':
      await revokeForCharge(admin, event.data.object, 'refund');
      return;

    case 'charge.dispute.created': {
      const dispute = event.data.object;
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id;
      const charge = await getStripe().charges.retrieve(chargeId);
      await revokeForCharge(admin, charge, 'dispute');
      return;
    }

    default:
      logger.debug('Evento de Stripe no manejado', { type: event.type });
  }
}
