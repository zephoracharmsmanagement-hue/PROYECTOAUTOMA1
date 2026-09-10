import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { CheckoutButton } from '@/components/members/checkout-button';
import { PurchaseTracker } from '@/components/analytics/purchase-tracker';
import { getAccessState } from '@/lib/entitlements';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Pago confirmado', robots: { index: false } };
export const dynamic = 'force-dynamic';

interface UpsellOffer {
  id: string;
  headline: string;
  description: string | null;
  priceCents: number | null;
  compareAtCents: number | null;
  currency: string;
}

/**
 * Busca una oferta post-compra para lo que el cliente acaba de adquirir.
 *
 * No es un pago en un clic: lleva a una sesión de Checkout nueva. Cobrar de
 * nuevo sin intervención exigiría guardar el método de pago y hacer cargos
 * off-session, lo que en Europa choca con la autenticación reforzada (SCA) y
 * puede acabar en disputa. Como el cliente ya existe en Stripe, el segundo
 * checkout es de todos modos muy rápido.
 */
async function findUpsell(sessionId: string | undefined, ownedPackageIds: Set<string>) {
  if (!sessionId) return null;

  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase
    .from('orders')
    .select('package_id')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();

  if (!order?.package_id) return null;

  const { data: offers } = await supabase
    .from('offers')
    .select(
      'id, headline, description, price_cents, offer_package_id, packages!offers_offer_package_id_fkey(price_one_time_cents, compare_at_price_cents, currency)',
    )
    .eq('source_package_id', order.package_id)
    .eq('placement', 'upsell')
    .eq('is_active', true)
    .order('sort_order')
    .limit(3);

  // Nunca se ofrece algo que el cliente ya tiene.
  const candidate = (offers ?? []).find((offer) => !ownedPackageIds.has(offer.offer_package_id));
  if (!candidate) return null;

  const offered = candidate.packages as unknown as {
    price_one_time_cents: number | null;
    compare_at_price_cents: number | null;
    currency: string;
  } | null;

  const upsell: UpsellOffer = {
    id: candidate.id,
    headline: candidate.headline,
    description: candidate.description,
    priceCents: candidate.price_cents ?? offered?.price_one_time_cents ?? null,
    compareAtCents: candidate.price_cents ? (offered?.price_one_time_cents ?? null) : null,
    currency: offered?.currency ?? 'usd',
  };

  return upsell;
}

/**
 * Página de retorno de Stripe.
 *
 * IMPORTANTE: aquí NO se concede acceso. El entitlement lo escribe el webhook,
 * que puede tardar unos segundos. Si el usuario llega antes, se le explica y se
 * le ofrece recargar; su compra ya está registrada en Stripe pase lo que pase.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const [{ session_id: sessionId }, access] = await Promise.all([searchParams, getAccessState()]);

  const ready = access.hasAllAccess || access.packageIds.size > 0;
  const kind = access.hasAllAccess ? 'subscription' : ready ? 'package' : 'unknown';
  const upsell = ready ? await findUpsell(sessionId, access.packageIds) : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <PurchaseTracker kind={kind} />

      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-500 text-2xl text-ink-950">
        ✓
      </div>

      <h1 className="mt-8 text-3xl font-bold tracking-tight">¡Pago confirmado!</h1>

      {ready ? (
        <>
          <p className="mt-4 text-mist-400">
            Tu acceso ya está activo. Entra a tu biblioteca y empieza cuando quieras.
          </p>
          <ButtonLink href="/dashboard" size="lg" className="mt-8">
            Ir a mi biblioteca
          </ButtonLink>
        </>
      ) : (
        <>
          <p className="mt-4 text-mist-400">
            Estamos activando tu acceso. Suele tardar unos segundos; recarga esta página si aún no
            lo ves.
          </p>
          <ButtonLink href="/checkout/exito" variant="secondary" size="lg" className="mt-8">
            Recargar
          </ButtonLink>
        </>
      )}

      {upsell && (
        <section className="mt-14 rounded-2xl border border-brand-600/50 bg-brand-500/5 p-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
            Solo desde esta página
          </p>

          <h2 className="mt-2 text-xl font-bold">{upsell.headline}</h2>
          {upsell.description && <p className="mt-2 text-sm text-mist-400">{upsell.description}</p>}

          {upsell.priceCents !== null && (
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatPrice(upsell.priceCents, upsell.currency)}
              </span>
              {upsell.compareAtCents && upsell.compareAtCents > upsell.priceCents && (
                <span className="text-sm text-mist-400 line-through">
                  {formatPrice(upsell.compareAtCents, upsell.currency)}
                </span>
              )}
            </p>
          )}

          <CheckoutButton
            intent={{ kind: 'upsell', offerId: upsell.id }}
            size="lg"
            className="mt-5"
          >
            Añadirlo a mi cuenta
          </CheckoutButton>

          <p className="mt-3 text-xs text-mist-400">
            Si prefieres no añadirlo, tu compra anterior no se ve afectada.
          </p>
        </section>
      )}
    </div>
  );
}
