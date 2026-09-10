import type { MetadataRoute } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';

// El sitemap se regenera cada hora: publicar un paquete no debe tardar un
// despliegue en aparecer en los buscadores.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/paquetes`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/precios`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/legal/terminos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/legal/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/legal/reembolsos`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  try {
    const supabase = await createSupabaseServerClient();
    const { data: packages } = await supabase
      .from('packages')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('sort_order');

    const packageRoutes: MetadataRoute.Sitemap = (packages ?? []).map((pkg) => ({
      url: `${siteUrl}/paquetes/${pkg.slug}`,
      lastModified: new Date(pkg.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...packageRoutes];
  } catch {
    // Un fallo de base de datos no debe dejar el sitio sin sitemap.
    return staticRoutes;
  }
}
