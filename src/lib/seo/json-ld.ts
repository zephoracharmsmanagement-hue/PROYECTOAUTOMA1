import type { PackageRow, PlanRow, TestimonialRow } from '@/types/database.types';
import { siteConfig } from '@/config/site';

/**
 * Generadores de datos estructurados (schema.org).
 *
 * Solo se emite marcado que se corresponde con contenido realmente visible en la
 * página. Declarar reseñas o precios que el usuario no ve es motivo de sanción
 * manual en Google, además de un problema legal de publicidad engañosa.
 */

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteUrl,
    description: siteConfig.description,
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.support.email,
      contactType: 'customer support',
      availableLanguage: ['es'],
    },
  };
}

export function websiteJsonLd(siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteUrl,
    inLanguage: 'es',
  };
}

/**
 * Ficha de producto de un paquete.
 *
 * `aggregateRating` y `review` solo se incluyen si existen testimonios reales
 * con puntuación asociados al paquete.
 */
export function packageJsonLd(
  pkg: PackageRow,
  siteUrl: string,
  testimonials: TestimonialRow[] = [],
): JsonLd {
  const url = `${siteUrl}/paquetes/${pkg.slug}`;
  const rated = testimonials.filter((item) => typeof item.rating === 'number');

  const base: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pkg.title,
    description: pkg.outcome ?? pkg.description ?? pkg.subtitle ?? pkg.title,
    url,
    category: pkg.category,
    brand: { '@type': 'Brand', name: siteConfig.name },
    ...(pkg.cover_url ? { image: pkg.cover_url } : {}),
  };

  if (pkg.price_one_time_cents && pkg.stripe_price_id_one_time) {
    base.offers = {
      '@type': 'Offer',
      url,
      price: (pkg.price_one_time_cents / 100).toFixed(2),
      priceCurrency: pkg.currency.toUpperCase(),
      availability: 'https://schema.org/InStock',
      // Producto digital: se entrega al instante y no tiene stock limitado.
      itemCondition: 'https://schema.org/NewCondition',
    };
  }

  if (rated.length > 0) {
    const total = rated.reduce((sum, item) => sum + (item.rating ?? 0), 0);

    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (total / rated.length).toFixed(1),
      reviewCount: rated.length,
      bestRating: 5,
      worstRating: 1,
    };

    base.review = rated.slice(0, 5).map((item) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: item.author_name },
      reviewRating: { '@type': 'Rating', ratingValue: item.rating, bestRating: 5, worstRating: 1 },
      reviewBody: item.quote,
      datePublished: item.created_at.slice(0, 10),
    }));
  }

  return base;
}

/** Página de precios: la membresía como servicio con sus planes. */
export function subscriptionJsonLd(plans: PlanRow[], siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${siteConfig.name} All Access`,
    description: 'Acceso completo al catálogo de paquetes y a cada nuevo lanzamiento.',
    url: `${siteUrl}/precios`,
    brand: { '@type': 'Brand', name: siteConfig.name },
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      url: `${siteUrl}/precios`,
      price: (plan.price_cents / 100).toFixed(2),
      priceCurrency: plan.currency.toUpperCase(),
      availability: 'https://schema.org/InStock',
    })),
  };
}

/** Preguntas frecuentes de la portada. */
export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

/** Migas de pan para la ficha de paquete. */
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
