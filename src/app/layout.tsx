import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { getCurrentUser } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/admin/guard';
import { siteConfig } from '@/config/site';
import { publicEnv } from '@/lib/env';
import { AnalyticsScripts } from '@/components/analytics/analytics-scripts';

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Solo se consulta el rol si hay sesion: una visita anonima no paga la query.
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <SiteHeader isAuthenticated={Boolean(user)} isAdmin={isAdmin} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
