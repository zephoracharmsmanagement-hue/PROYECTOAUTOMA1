import type { MetadataRoute } from 'next';
import { publicEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Rutas privadas o sin valor de indexacion. Nada aqui es un control de
        // acceso: el area de miembros la protegen el middleware y RLS.
        disallow: [
          '/admin',
          '/dashboard',
          '/biblioteca',
          '/cuenta',
          '/checkout',
          '/afiliados',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
