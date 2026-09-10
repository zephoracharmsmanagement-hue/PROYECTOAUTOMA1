import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { getAccessState } from '@/lib/entitlements';
import { PurchaseTracker } from '@/components/analytics/purchase-tracker';

export const metadata: Metadata = { title: 'Pago confirmado', robots: { index: false } };
export const dynamic = 'force-dynamic';

/**
 * Pagina de retorno de Stripe.
 *
 * IMPORTANTE: aqui NO se concede acceso. El entitlement lo escribe el webhook,
 * que puede tardar unos segundos. Si el usuario llega antes, se le explica y se
 * le ofrece recargar; su compra ya esta registrada en Stripe pase lo que pase.
 */
export default async function CheckoutSuccessPage() {
  const access = await getAccessState();
  const ready = access.hasAllAccess || access.packageIds.size > 0;

  const kind = access.hasAllAccess ? 'subscription' : ready ? 'package' : 'unknown';

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
    </div>
  );
}
