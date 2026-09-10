import Script from 'next/script';
import { publicEnv } from '@/lib/env';

/**
 * Carga el script del proveedor de analítica configurado.
 *
 * Plausible es el proveedor por defecto: no usa cookies ni datos personales, así
 * que no obliga a un banner de consentimiento. GA4 sí lo requiere en la UE; si
 * lo activas, añade tu solución de consentimiento antes de publicar.
 */
export function AnalyticsScripts() {
  const provider = publicEnv.NEXT_PUBLIC_ANALYTICS_PROVIDER;

  if (provider === 'plausible' && publicEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
    const host = publicEnv.NEXT_PUBLIC_PLAUSIBLE_HOST ?? 'https://plausible.io';

    return (
      <>
        <Script
          defer
          data-domain={publicEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
          src={`${host}/js/script.tagged-events.js`}
          strategy="afterInteractive"
        />
        {/* Cola de eventos: permite llamar a plausible() antes de que cargue. */}
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
      </>
    );
  }

  if (provider === 'ga4' && publicEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    const id = publicEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${id}', { send_page_view: true });`}
        </Script>
      </>
    );
  }

  return null;
}
