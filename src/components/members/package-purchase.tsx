'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics/track';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface BumpOffer {
  id: string;
  headline: string;
  description: string | null;
  priceCents: number | null;
  compareAtCents: number | null;
  currency: string;
}

/**
 * Botón de compra con order bumps.
 *
 * El cliente solo envía QUÉ quiere comprar: el slug del paquete y los ids de las
 * ofertas marcadas. Los precios los resuelve el servidor, que además verifica
 * que cada oferta pertenece de verdad a este paquete y sigue activa.
 */
export function PackagePurchase({
  slug,
  label,
  bumps,
}: {
  slug: string;
  label: string;
  bumps: BumpOffer[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(offerId: string) {
    setSelected((current) => {
      const next = new Set(current);
      const isSelected = next.has(offerId);

      if (isSelected) next.delete(offerId);
      else next.add(offerId);

      track({
        name: 'bump_toggled',
        props: { offer: offerId, selected: isSelected ? 'no' : 'yes' },
      });
      return next;
    });
  }

  async function handleBuy() {
    setLoading(true);
    setError(null);

    track({ name: 'begin_checkout', props: { kind: 'package', item: slug } });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'package', slug, bumpOfferIds: [...selected] }),
      });

      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/paquetes/${slug}`)}`);
        return;
      }

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        const reason = payload.error ?? 'unknown';
        track({ name: 'checkout_failed', props: { kind: 'package', reason } });
        setError(payload.error ?? 'No se pudo iniciar el pago. Inténtalo de nuevo.');
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setError('Fallo de conexión. Revisa tu red e inténtalo otra vez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {bumps.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          {bumps.map((bump) => (
            <label
              key={bump.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-brand-600/60 bg-brand-500/5 p-4"
            >
              <input
                type="checkbox"
                checked={selected.has(bump.id)}
                onChange={() => toggle(bump.id)}
                className="mt-0.5 h-4 w-4 accent-[var(--color-brand-500)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-brand-400">{bump.headline}</span>
                {bump.description && (
                  <span className="mt-1 block text-xs text-mist-400">{bump.description}</span>
                )}
                {bump.priceCents !== null && (
                  <span className="mt-2 block text-sm">
                    <span className="font-semibold">
                      + {formatPrice(bump.priceCents, bump.currency)}
                    </span>
                    {bump.compareAtCents && bump.compareAtCents > bump.priceCents && (
                      <span className="ml-2 text-xs text-mist-400 line-through">
                        {formatPrice(bump.compareAtCents, bump.currency)}
                      </span>
                    )}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      )}

      <Button onClick={handleBuy} disabled={loading} size="lg" className="mt-6 w-full">
        {loading ? 'Redirigiendo…' : label}
      </Button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
