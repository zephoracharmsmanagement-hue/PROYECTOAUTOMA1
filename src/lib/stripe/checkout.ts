import 'server-only';

import type Stripe from 'stripe';
import { getStripe, METADATA_KEYS } from '@/lib/stripe/client';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isLive } from '@/lib/campaigns';
import { resolveAffiliateId } from '@/lib/affiliates';
import { publicEnv } from '@/lib/env';
import { absoluteUrl } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { OrderItemKind } from '@/types/database.types';

export type CheckoutIntent =
  | { kind: 'package'; slug: string; bumpOfferIds?: string[] }
  | { kind: 'path'; slug: string }
  | { kind: 'upsell'; offerId: string }
  | { kind: 'subscription'; planSlug: string };

export interface CheckoutUser {
  id: string;
  email: string;
  fullName?: string | null;
}

type Admin = ReturnType<typeof createSupabaseAdminClient>;

/** Una línea del checkout, ya resuelta contra la base de datos. */
interface ResolvedLine {
  packageId: string;
  priceId: string;
  amountCents: number;
  kind: OrderItemKind;
}

/**
 * Descuento a aplicar, si hay campaña vigente con código de Stripe.
 *
 * Aplicar el código automáticamente convierte mejor que pedir al cliente que lo
 * teclee. Stripe no permite combinar `discounts` con `allow_promotion_codes`, así
 * que es lo uno o lo otro.
 */
async function resolveCampaignDiscount(
  admin: Admin,
): Promise<Pick<Stripe.Checkout.SessionCreateParams, 'discounts' | 'allow_promotion_codes'>> {
  const { data } = await admin
    .from('campaigns')
    .select('is_active, starts_at, ends_at, stripe_promotion_code_id')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  const campaign = (data ?? []).find(isLive);

  if (campaign?.stripe_promotion_code_id) {
    return { discounts: [{ promotion_code: campaign.stripe_promotion_code_id }] };
  }

  return { allow_promotion_codes: true };
}

/** ¿El usuario ya tiene acceso a este paquete? */
async function alreadyOwns(admin: Admin, userId: string, packageId: string): Promise<boolean> {
  const { data } = await admin
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', 'package')
    .eq('package_id', packageId)
    .eq('status', 'active')
    .maybeSingle();

  return Boolean(data);
}

/**
 * Resuelve las ofertas seleccionadas como order bump.
 *
 * Cada oferta se valida contra el paquete de origen: enviar el id de una oferta
 * que pertenece a otro paquete —o que está desactivada— no añade nada al carrito.
 */
async function resolveBumps(
  admin: Admin,
  sourcePackageId: string,
  offerIds: string[],
  userId: string,
): Promise<ResolvedLine[]> {
  if (offerIds.length === 0) return [];

  const { data: offers } = await admin
    .from('offers')
    .select(
      'id, offer_package_id, stripe_price_id, price_cents, packages!offers_offer_package_id_fkey(stripe_price_id_one_time, price_one_time_cents, status)',
    )
    .in('id', offerIds)
    .eq('source_package_id', sourcePackageId)
    .eq('placement', 'bump')
    .eq('is_active', true);

  const lines: ResolvedLine[] = [];

  for (const offer of offers ?? []) {
    const pkg = offer.packages as unknown as {
      stripe_price_id_one_time: string | null;
      price_one_time_cents: number | null;
      status: string;
    } | null;

    if (!pkg || pkg.status === 'archived') continue;
    if (await alreadyOwns(admin, userId, offer.offer_package_id)) continue;

    // Precio especial de la oferta si existe; si no, el precio normal.
    const priceId = offer.stripe_price_id ?? pkg.stripe_price_id_one_time;
    if (!priceId) continue;

    lines.push({
      packageId: offer.offer_package_id,
      priceId,
      amountCents: offer.price_cents ?? pkg.price_one_time_cents ?? 0,
      kind: 'bump',
    });
  }

  return lines;
}

/**
 * Registra la orden como `pending` en el momento de crear la sesión.
 *
 * Es lo que convierte los abandonos en algo medible: sin esta fila, un carrito
 * abandonado no deja rastro en ninguna parte. El webhook la pasa después a
 * `paid` o a `expired`.
 */
async function recordPendingOrder(
  admin: Admin,
  session: Stripe.Checkout.Session,
  userId: string,
  lines: ResolvedLine[],
  pathId: string | null = null,
) {
  const main = lines.find((line) => line.kind === 'main') ?? lines[0];
  if (!main) return;

  const { data: order, error } = await admin
    .from('orders')
    .upsert(
      {
        user_id: userId,
        package_id: main.packageId,
        path_id: pathId,
        stripe_checkout_session_id: session.id,
        amount_cents: session.amount_total ?? lines.reduce((sum, l) => sum + l.amountCents, 0),
        currency: session.currency ?? 'usd',
        status: 'pending',
      },
      { onConflict: 'stripe_checkout_session_id' },
    )
    .select('id')
    .single();

  if (error || !order) {
    // No poder registrar el pendiente degrada la analítica de abandono, pero no
    // debe impedir la compra: el webhook creará la orden igualmente al cobrar.
    logger.warn('No se pudo registrar la orden pendiente', {
      sessionId: session.id,
      error: error?.message,
    });
    return;
  }

  const { error: itemsError } = await admin.from('order_items').upsert(
    lines.map((line) => ({
      order_id: order.id,
      package_id: line.packageId,
      kind: line.kind,
      amount_cents: line.amountCents,
    })),
    { onConflict: 'order_id,package_id' },
  );

  if (itemsError) {
    logger.warn('No se pudieron registrar las líneas de la orden', { error: itemsError.message });
  }
}

/**
 * Crea la sesión de Stripe Checkout.
 *
 * SEGURIDAD: los precios SIEMPRE se resuelven en el servidor a partir de slugs e
 * identificadores de oferta. El cliente nunca envía importes ni price ids, de
 * modo que manipular la petición no puede alterar lo que se cobra.
 */
export async function createCheckoutSession(
  intent: CheckoutIntent,
  user: CheckoutUser,
): Promise<Stripe.Checkout.Session> {
  const admin = createSupabaseAdminClient();
  const stripe = getStripe();

  const customerId = await getOrCreateStripeCustomer({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
  });

  const [discount, affiliateId] = await Promise.all([
    resolveCampaignDiscount(admin),
    resolveAffiliateId(user.id),
  ]);

  // La metadata de afiliado viaja en todos los checkouts; el webhook decide si
  // genera comision.
  const affiliateMetadata: Record<string, string> = affiliateId
    ? { [METADATA_KEYS.affiliateId]: affiliateId }
    : {};

  const common = {
    customer: customerId,
    client_reference_id: user.id,
    billing_address_collection: 'auto',
    ...discount,
  } satisfies Partial<Stripe.Checkout.SessionCreateParams>;

  // ---------------------------------------------------------------- UPSELL
  if (intent.kind === 'upsell') {
    const { data: offer } = await admin
      .from('offers')
      .select(
        'id, offer_package_id, stripe_price_id, price_cents, packages!offers_offer_package_id_fkey(slug, stripe_price_id_one_time, price_one_time_cents, status)',
      )
      .eq('id', intent.offerId)
      .eq('placement', 'upsell')
      .eq('is_active', true)
      .maybeSingle();

    if (!offer) throw new Error('Oferta no disponible.');

    const pkg = offer.packages as unknown as {
      slug: string;
      stripe_price_id_one_time: string | null;
      price_one_time_cents: number | null;
      status: string;
    } | null;

    if (!pkg) throw new Error('Oferta no disponible.');
    if (await alreadyOwns(admin, user.id, offer.offer_package_id)) {
      throw new Error('Ya tienes acceso a este paquete.');
    }

    const priceId = offer.stripe_price_id ?? pkg.stripe_price_id_one_time;
    if (!priceId) throw new Error('La oferta no tiene precio configurado.');

    const lines: ResolvedLine[] = [
      {
        packageId: offer.offer_package_id,
        priceId,
        amountCents: offer.price_cents ?? pkg.price_one_time_cents ?? 0,
        kind: 'upsell',
      },
    ];

    const metadata = {
      [METADATA_KEYS.userId]: user.id,
      [METADATA_KEYS.packageIds]: offer.offer_package_id,
      [METADATA_KEYS.kind]: 'package',
      ...affiliateMetadata,
    };

    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      payment_intent_data: { metadata },
      metadata,
      success_url: absoluteUrl(
        '/checkout/exito?session_id={CHECKOUT_SESSION_ID}',
        publicEnv.NEXT_PUBLIC_SITE_URL,
      ),
      cancel_url: absoluteUrl('/dashboard', publicEnv.NEXT_PUBLIC_SITE_URL),
    });

    await recordPendingOrder(admin, session, user.id, lines);
    return session;
  }

  // ------------------------------------------------------------------ RUTA
  if (intent.kind === 'path') {
    const { data: path } = await admin
      .from('paths')
      .select('id, slug, title, price_one_time_cents, stripe_price_id_one_time, status')
      .eq('slug', intent.slug)
      .maybeSingle();

    if (!path) throw new Error(`Ruta no encontrada: ${intent.slug}`);
    if (path.status !== 'published') throw new Error('Esta ruta no esta a la venta.');
    if (!path.stripe_price_id_one_time) {
      throw new Error('La ruta no tiene precio configurado en Stripe.');
    }

    const { data: members } = await admin
      .from('path_packages')
      .select('package_id, sort_order')
      .eq('path_id', path.id)
      .order('sort_order');

    if (!members || members.length === 0) throw new Error('Esta ruta no tiene paquetes.');

    // Se conceden todos los paquetes de la ruta, incluidos los que el cliente ya
    // tuviera: el precio del lote es unico y no se prorratea. Si ya los tiene
    // todos, no hay nada que vender.
    const owned = await Promise.all(
      members.map((member) => alreadyOwns(admin, user.id, member.package_id)),
    );

    if (owned.every(Boolean)) {
      throw new Error('Ya tienes acceso a todos los paquetes de esta ruta.');
    }

    const lines: ResolvedLine[] = members.map((member) => ({
      packageId: member.package_id,
      priceId: path.stripe_price_id_one_time as string,
      // El importe va entero en la primera linea: es un lote con un solo precio,
      // no una suma de precios individuales.
      amountCents: 0,
      kind: 'path' as const,
    }));

    const metadata = {
      [METADATA_KEYS.userId]: user.id,
      [METADATA_KEYS.packageIds]: members.map((member) => member.package_id).join(','),
      [METADATA_KEYS.kind]: 'package',
      ...affiliateMetadata,
    };

    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'payment',
      // Una sola linea de cobro: la del precio del lote.
      line_items: [{ price: path.stripe_price_id_one_time, quantity: 1 }],
      payment_intent_data: { metadata },
      metadata,
      success_url: absoluteUrl(
        '/checkout/exito?session_id={CHECKOUT_SESSION_ID}',
        publicEnv.NEXT_PUBLIC_SITE_URL,
      ),
      cancel_url: absoluteUrl(`/rutas/${path.slug}`, publicEnv.NEXT_PUBLIC_SITE_URL),
    });

    await recordPendingOrder(admin, session, user.id, lines, path.id);
    return session;
  }

  // --------------------------------------------------------------- PAQUETE
  if (intent.kind === 'package') {
    const { data: pkg, error } = await admin
      .from('packages')
      .select('id, slug, title, stripe_price_id_one_time, price_one_time_cents, status')
      .eq('slug', intent.slug)
      .single();

    if (error || !pkg) throw new Error(`Paquete no encontrado: ${intent.slug}`);
    if (pkg.status !== 'published')
      throw new Error(`El paquete ${intent.slug} no esta a la venta.`);
    if (!pkg.stripe_price_id_one_time) {
      throw new Error(`El paquete ${intent.slug} no tiene precio de pago unico configurado.`);
    }
    if (await alreadyOwns(admin, user.id, pkg.id)) {
      throw new Error('Ya tienes acceso a este paquete.');
    }

    const bumps = await resolveBumps(admin, pkg.id, intent.bumpOfferIds ?? [], user.id);

    const lines: ResolvedLine[] = [
      {
        packageId: pkg.id,
        priceId: pkg.stripe_price_id_one_time,
        amountCents: pkg.price_one_time_cents ?? 0,
        kind: 'main',
      },
      ...bumps,
    ];

    // Una sola clave con todos los paquetes: el webhook concede acceso a cada uno.
    const metadata = {
      [METADATA_KEYS.userId]: user.id,
      [METADATA_KEYS.packageIds]: lines.map((line) => line.packageId).join(','),
      [METADATA_KEYS.kind]: 'package',
      ...affiliateMetadata,
    };

    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'payment',
      line_items: lines.map((line) => ({ price: line.priceId, quantity: 1 })),
      // La metadata se duplica en el PaymentIntent para que sobreviva al cobro,
      // no solo a la sesión de checkout.
      payment_intent_data: { metadata },
      metadata,
      success_url: absoluteUrl(
        '/checkout/exito?session_id={CHECKOUT_SESSION_ID}',
        publicEnv.NEXT_PUBLIC_SITE_URL,
      ),
      cancel_url: absoluteUrl(`/paquetes/${pkg.slug}`, publicEnv.NEXT_PUBLIC_SITE_URL),
    });

    await recordPendingOrder(admin, session, user.id, lines);
    return session;
  }

  // ----------------------------------------------------------- SUSCRIPCION
  const { data: plan, error } = await admin
    .from('plans')
    .select('id, slug, stripe_price_id, trial_days, is_active')
    .eq('slug', intent.planSlug)
    .single();

  if (error || !plan) throw new Error(`Plan no encontrado: ${intent.planSlug}`);
  if (!plan.is_active) throw new Error(`El plan ${intent.planSlug} no esta disponible.`);

  return stripe.checkout.sessions.create({
    ...common,
    mode: 'subscription',
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    subscription_data: {
      ...(plan.trial_days > 0 ? { trial_period_days: plan.trial_days } : {}),
      metadata: {
        [METADATA_KEYS.userId]: user.id,
        [METADATA_KEYS.planId]: plan.id,
        [METADATA_KEYS.kind]: 'subscription',
        ...affiliateMetadata,
      },
    },
    metadata: {
      [METADATA_KEYS.userId]: user.id,
      [METADATA_KEYS.planId]: plan.id,
      [METADATA_KEYS.kind]: 'subscription',
      ...affiliateMetadata,
    },
    success_url: absoluteUrl(
      '/checkout/exito?session_id={CHECKOUT_SESSION_ID}',
      publicEnv.NEXT_PUBLIC_SITE_URL,
    ),
    cancel_url: absoluteUrl('/precios', publicEnv.NEXT_PUBLIC_SITE_URL),
  });
}

/** Enlace al Billing Portal para gestionar o cancelar la suscripción. */
export async function createBillingPortalSession(
  customerId: string,
): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: absoluteUrl('/cuenta', publicEnv.NEXT_PUBLIC_SITE_URL),
  });
}
