'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics/track';

export type CheckoutIntentInput =
  | { kind: 'package'; slug: string; bumpOfferIds?: string[] }
  | { kind: 'upsell'; offerId: string }
  | { kind: 'subscription'; planSlug: string };

interface Props {
  intent: CheckoutIntentInput;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Inicia el checkout. El cliente solo envia QUE quiere comprar (un slug);
 * el precio lo resuelve el servidor contra la base de datos.
 */
export function CheckoutButton({ intent, children, variant, size, className }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const item =
      intent.kind === 'package'
        ? intent.slug
        : intent.kind === 'upsell'
          ? intent.offerId
          : intent.planSlug;

    const kind = intent.kind === 'subscription' ? 'subscription' : 'package';
    track({ name: 'begin_checkout', props: { kind, item } });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intent),
      });

      if (response.status === 401) {
        const next =
          intent.kind === 'package'
            ? `/paquetes/${intent.slug}`
            : intent.kind === 'upsell'
              ? '/dashboard'
              : '/precios';
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        const reason = payload.error ?? 'unknown';
        track({ name: 'checkout_failed', props: { kind, reason } });
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
    <div className={className}>
      <Button
        onClick={handleClick}
        disabled={loading}
        variant={variant}
        size={size}
        className="w-full"
      >
        {loading ? 'Redirigiendo…' : children}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
