import 'server-only';

import type Stripe from 'stripe';
import { getStripe, METADATA_KEYS } from '@/lib/stripe/client';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { publicEnv } from '@/lib/env';
import { absoluteUrl } from '@/lib/utils';

export type CheckoutIntent =
  { kind: 'package'; slug: string } | { kind: 'subscription'; planSlug: string };

export interface CheckoutUser {
  id: string;
  email: string;
  fullName?: string | null;
}

/**
 * Crea la sesion de Stripe Checkout.
 *
 * SEGURIDAD: el precio SIEMPRE se resuelve en el servidor desde la base de
 * datos a partir del slug. El cliente nunca envia importes ni price ids, de modo
 * que manipular la peticion no puede alterar lo que se cobra.
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

  const common = {
    customer: customerId,
    client_reference_id: user.id,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  } satisfies Partial<Stripe.Checkout.SessionCreateParams>;

  if (intent.kind === 'package') {
    const { data: pkg, error } = await admin
      .from('packages')
      .select('id, slug, title, stripe_price_id_one_time, status')
      .eq('slug', intent.slug)
      .single();

    if (error || !pkg) throw new Error(`Paquete no encontrado: ${intent.slug}`);
    if (pkg.status !== 'published')
      throw new Error(`El paquete ${intent.slug} no esta a la venta.`);
    if (!pkg.stripe_price_id_one_time) {
      throw new Error(`El paquete ${intent.slug} no tiene precio de pago unico configurado.`);
    }

    // Si ya lo compro, no se le deja pagar dos veces.
    const { data: existing } = await admin
      .from('entitlements')
      .select('id')
      .eq('user_id', user.id)
      .eq('kind', 'package')
      .eq('package_id', pkg.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) throw new Error('Ya tienes acceso a este paquete.');

    return stripe.checkout.sessions.create({
      ...common,
      mode: 'payment',
      line_items: [{ price: pkg.stripe_price_id_one_time, quantity: 1 }],
      // `payment_intent_data.metadata` asegura que el dato sobrevive al cobro,
      // no solo a la sesion de checkout.
      payment_intent_data: {
        metadata: {
          [METADATA_KEYS.userId]: user.id,
          [METADATA_KEYS.packageId]: pkg.id,
          [METADATA_KEYS.kind]: 'package',
        },
      },
      metadata: {
        [METADATA_KEYS.userId]: user.id,
        [METADATA_KEYS.packageId]: pkg.id,
        [METADATA_KEYS.kind]: 'package',
      },
      success_url: absoluteUrl(
        '/checkout/exito?session_id={CHECKOUT_SESSION_ID}',
        publicEnv.NEXT_PUBLIC_SITE_URL,
      ),
      cancel_url: absoluteUrl(`/paquetes/${pkg.slug}`, publicEnv.NEXT_PUBLIC_SITE_URL),
    });
  }

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
      },
    },
    metadata: {
      [METADATA_KEYS.userId]: user.id,
      [METADATA_KEYS.planId]: plan.id,
      [METADATA_KEYS.kind]: 'subscription',
    },
    success_url: absoluteUrl(
      '/checkout/exito?session_id={CHECKOUT_SESSION_ID}',
      publicEnv.NEXT_PUBLIC_SITE_URL,
    ),
    cancel_url: absoluteUrl('/precios', publicEnv.NEXT_PUBLIC_SITE_URL),
  });
}

/** Enlace al Billing Portal para gestionar o cancelar la suscripcion. */
export async function createBillingPortalSession(
  customerId: string,
): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: absoluteUrl('/cuenta', publicEnv.NEXT_PUBLIC_SITE_URL),
  });
}
