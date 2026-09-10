import 'server-only';

import type Stripe from 'stripe';
import { getStripe, METADATA_KEYS } from '@/lib/stripe/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/client';
import {
  purchaseEmail,
  subscriptionEmail,
  paymentFailedEmail,
  abandonedCheckoutEmail,
} from '@/lib/email/templates';
import { publicEnv } from '@/lib/env';
import { absoluteUrl } from '@/lib/utils';
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

async function emailOf(admin: Admin, userId: string): Promise<string | null> {
  const { data } = await admin.from('profiles').select('email').eq('id', userId).maybeSingle();
  return data?.email ?? null;
}

/**
 * Envuelve el envio de email para que NUNCA propague un fallo.
 *
 * Si un error de email escapara hasta el manejador, el webhook devolveria 500,
 * Stripe reintentaria el evento y el usuario recibiria el mismo correo varias
 * veces. En ese punto el acceso ya esta concedido: el email es accesorio.
 */
async function notify(to: string | null, message: { subject: string; html: string; text: string }) {
  if (!to) return;
  try {
    await sendEmail({ to, ...message });
  } catch (error) {
    logger.error('Fallo inesperado enviando notificacion', {
      message: error instanceof Error ? error.message : 'desconocido',
    });
  }
}

// -----------------------------------------------------------------------------
// Compra de pago unico
// -----------------------------------------------------------------------------

/** Lee los paquetes comprados de la metadata, con la clave heredada de reserva. */
function packageIdsFrom(metadata: Stripe.Metadata | null | undefined): string[] {
  const many = metadata?.[METADATA_KEYS.packageIds];
  if (many)
    return many
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

  const single = metadata?.[METADATA_KEYS.packageId];
  return single ? [single] : [];
}

async function handleOneTimePurchase(admin: Admin, session: Stripe.Checkout.Session) {
  const userId = await resolveUserId(admin, session.metadata, customerIdOf(session.customer));
  const packageIds = packageIdsFrom(session.metadata);

  if (!userId || packageIds.length === 0) {
    logger.error('Checkout de pago unico sin metadata suficiente', {
      sessionId: session.id,
      userId,
      packageCount: packageIds.length,
    });
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  // La orden se identifica por la sesion de checkout: reintentos no duplican, y
  // si ya existia como `pending` (registrada al crear la sesion) se actualiza.
  const { data: order, error: orderError } = await admin
    .from('orders')
    .upsert(
      {
        user_id: userId,
        package_id: packageIds[0],
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

  // Un checkout con order bump concede acceso a varios paquetes de una vez.
  const { error: entitlementError } = await admin.from('entitlements').upsert(
    packageIds.map((packageId) => ({
      user_id: userId,
      kind: 'package' as const,
      package_id: packageId,
      source: 'purchase' as const,
      status: 'active' as const,
      order_id: order.id,
      // Compra vitalicia: sin caducidad.
      expires_at: null,
    })),
    { onConflict: 'user_id,package_id' },
  );

  if (entitlementError) {
    throw new Error(`No se pudo conceder el acceso al paquete: ${entitlementError.message}`);
  }

  // Si la orden se creo en el webhook (sin fila `pending` previa), las lineas
  // aun no existen. Este upsert las deja consistentes en ambos caminos.
  await admin.from('order_items').upsert(
    packageIds.map((packageId, index) => ({
      order_id: order.id,
      package_id: packageId,
      kind: index === 0 ? ('main' as const) : ('bump' as const),
      amount_cents: 0,
    })),
    { onConflict: 'order_id,package_id', ignoreDuplicates: true },
  );

  logger.info('Acceso a paquetes concedido', {
    userId,
    packageCount: packageIds.length,
    orderId: order.id,
  });

  const { data: packages } = await admin.from('packages').select('title').in('id', packageIds);

  const titles = (packages ?? []).map((pkg) => pkg.title);

  await notify(
    await emailOf(admin, userId),
    purchaseEmail({
      packageTitle: titles.length > 0 ? titles.join(' + ') : 'tu nuevo paquete',
      libraryUrl: absoluteUrl('/dashboard', publicEnv.NEXT_PUBLIC_SITE_URL),
    }),
  );
}

/**
 * Carrito abandonado: Stripe caduca las sesiones no pagadas y avisa con
 * `checkout.session.expired`.
 *
 * La orden pendiente pasa a `expired` (queda medible en el panel) y se envia un
 * unico email de recuperacion. La idempotencia del webhook garantiza que no se
 * envie dos veces.
 */
async function handleAbandonedCheckout(admin: Admin, session: Stripe.Checkout.Session) {
  const userId = await resolveUserId(admin, session.metadata, customerIdOf(session.customer));
  const packageIds = packageIdsFrom(session.metadata);

  await admin
    .from('orders')
    .update({ status: 'expired' })
    .eq('stripe_checkout_session_id', session.id)
    .eq('status', 'pending');

  // El paquete principal es el que se ofrece para retomar la compra.
  const mainPackageId = packageIds[0];
  if (!userId || !mainPackageId) return;

  const { data: pkg } = await admin
    .from('packages')
    .select('title, slug')
    .eq('id', mainPackageId)
    .maybeSingle();

  if (!pkg) return;

  // Ya lo compro por otra via entre medias: seria absurdo pedirle que vuelva.
  const { data: owned } = await admin
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', 'package')
    .eq('package_id', mainPackageId)
    .eq('status', 'active')
    .maybeSingle();

  if (owned) return;

  logger.info('Checkout abandonado', { sessionId: session.id, userId });

  await notify(
    await emailOf(admin, userId),
    abandonedCheckoutEmail({
      packageTitle: pkg.title,
      packageUrl: absoluteUrl(`/paquetes/${pkg.slug}`, publicEnv.NEXT_PUBLIC_SITE_URL),
    }),
  );
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

  // ¿Es la primera vez que vemos esta suscripcion? Determina si toca dar la
  // bienvenida. `checkout.session.completed` y `customer.subscription.created`
  // describen el mismo alta, y sin esta comprobacion llegarian dos emails.
  const { data: known } = await admin
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  const isNew = !known;

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

  if (isNew && grants) {
    const { data: planRow } = plan?.id
      ? await admin.from('plans').select('name').eq('id', plan.id).maybeSingle()
      : { data: null };

    await notify(
      await emailOf(admin, userId),
      subscriptionEmail({
        planName: planRow?.name ?? 'All Access',
        libraryUrl: absoluteUrl('/dashboard', publicEnv.NEXT_PUBLIC_SITE_URL),
      }),
    );
  }
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

  // Se revoca TODO lo que traia la orden, no solo el paquete principal: un
  // reembolso de un checkout con order bump devuelve tambien los anadidos.
  const { data: items } = await admin
    .from('order_items')
    .select('package_id')
    .eq('order_id', order.id);

  const packageIds = (items ?? [])
    .map((item) => item.package_id)
    .filter((id): id is string => Boolean(id));

  // Ordenes anteriores a `order_items` solo tienen el paquete de la cabecera.
  if (packageIds.length === 0 && order.package_id) packageIds.push(order.package_id);

  if (packageIds.length > 0) {
    await admin
      .from('entitlements')
      .update({ status: 'revoked' })
      .eq('user_id', order.user_id)
      .eq('kind', 'package')
      .in('package_id', packageIds);
  }

  logger.info('Acceso revocado por reembolso o disputa', {
    orderId: order.id,
    packageCount: packageIds.length,
    reason,
  });
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

    case 'checkout.session.expired':
      await handleAbandonedCheckout(admin, event.data.object);
      return;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncSubscription(admin, event.data.object);
      return;

    case 'customer.subscription.deleted':
      await revokeSubscription(admin, event.data.object);
      return;

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = customerIdOf(invoice.customer);

      logger.warn('Pago de factura fallido', { invoiceId: invoice.id, customerId });

      // Aviso temprano: Stripe reintentara varios dias, pero avisar ahora
      // recupera pagos que de otro modo acaban en baja involuntaria.
      const userId = await resolveUserId(admin, invoice.metadata, customerId);
      if (userId) {
        await notify(
          await emailOf(admin, userId),
          paymentFailedEmail({
            portalUrl: absoluteUrl('/cuenta', publicEnv.NEXT_PUBLIC_SITE_URL),
          }),
        );
      }
      return;
    }

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
