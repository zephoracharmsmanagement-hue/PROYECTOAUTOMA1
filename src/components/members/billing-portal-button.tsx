'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/** Abre el Billing Portal de Stripe (cambiar tarjeta, facturas, cancelar). */
export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/portal', { method: 'POST' });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setError(payload.error ?? 'No se pudo abrir el portal.');
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setError('Fallo de conexión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading} variant="secondary">
        {loading ? 'Abriendo…' : 'Gestionar facturación'}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
