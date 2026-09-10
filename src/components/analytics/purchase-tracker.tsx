'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics/track';

/**
 * Dispara el evento de compra una sola vez en la página de retorno de Stripe.
 *
 * Es analítica, no concesión de acceso: si el usuario nunca llega aquí, el
 * webhook ya le dio el acceso igualmente. Por eso el evento puede perderse sin
 * consecuencias para el negocio, solo para la atribución.
 */
export function PurchaseTracker({ kind }: { kind: 'package' | 'subscription' | 'unknown' }) {
  useEffect(() => {
    track({ name: 'purchase_confirmed', props: { kind } });
  }, [kind]);

  return null;
}
