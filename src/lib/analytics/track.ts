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

export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.plausible === 'function') {
      window.plausible(event.name, { props: event.props });
      return;
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', event.name, event.props);
    }
  } catch {
    // La analítica nunca debe romper un flujo de compra. Se traga el error.
  }
}
