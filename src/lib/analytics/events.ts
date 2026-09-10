/**
 * Catálogo cerrado de eventos de conversión.
 *
 * Tenerlos en un único sitio evita el problema clásico de la analítica: nombres
 * escritos de tres formas distintas que luego no se pueden agregar en un informe.
 */
export type AnalyticsEvent =
  | { name: 'lead_submitted'; props: { source: string } }
  | { name: 'begin_checkout'; props: { kind: 'package' | 'subscription'; item: string } }
  | { name: 'checkout_failed'; props: { kind: 'package' | 'subscription'; reason: string } }
  | { name: 'purchase_confirmed'; props: { kind: 'package' | 'subscription' | 'unknown' } }
  | { name: 'lesson_started'; props: { package_slug: string; lesson_slug: string } }
  | { name: 'experiment_viewed'; props: { experiment: string; variant: string } }
  | { name: 'bump_toggled'; props: { offer: string; selected: 'yes' | 'no' } }
  | { name: 'upsell_accepted'; props: { offer: string } }
  | { name: 'certificate_issued'; props: { package_slug: string } };

export type AnalyticsEventName = AnalyticsEvent['name'];
