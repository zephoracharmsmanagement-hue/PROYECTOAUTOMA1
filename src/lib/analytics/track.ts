'use client';

import type { AnalyticsEvent } from '@/lib/analytics/events';

/**
 * Envío de eventos, agnóstico del proveedor.
 *
 * Si no hay analítica configurada, `track` es un no-op silencioso: la app
 * funciona igual en local y en previews sin ensuciar los datos de producción.
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
    gtag?: (command: string, event: string, params?: Record<string, unknown>) => void;
  }
}

/**
 * Variantes de experimento asignadas en esta página.
 *
 * Se adjuntan a TODOS los eventos posteriores. Así el embudo entero
 * (`begin_checkout`, `purchase_confirmed`…) queda segmentable por variante sin
 * tener que pasar el contexto a mano por cada componente.
 */
const experimentContext = new Map<string, string>();

export function setExperimentContext(experimentKey: string, variantId: string): void {
  experimentContext.set(experimentKey, variantId);
}

function withExperiments(props: Record<string, unknown>): Record<string, unknown> {
  if (experimentContext.size === 0) return props;

  const merged = { ...props };
  for (const [key, variantId] of experimentContext) {
    merged[`exp_${key}`] = variantId;
  }
  return merged;
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  try {
    const props = withExperiments(event.props);

    if (typeof window.plausible === 'function') {
      window.plausible(event.name, { props });
      return;
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', event.name, props);
    }
  } catch {
    // La analítica nunca debe romper un flujo de compra. Se traga el error.
  }
}
