import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { CheckoutButton } from '@/components/members/checkout-button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessState, canAccessPackage } from '@/lib/entitlements';
import { formatDuration, formatPrice } from '@/lib/utils';
import { GUARANTEE_DAYS } from '@/config/site';
import { Testimonials } from '@/components/marketing/testimonials';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbJsonLd, packageJsonLd } from '@/lib/seo/json-ld';
import { publicEnv } from '@/lib/env';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadPackage(slug: string) {
  const supabase = await createSupabaseServerClient();

  const { data: pkg } = await supabase
    .from('packages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!pkg) return null;

  const [{ data: modules }, { data: outline }, { data: testimonials }] = await Promise.all([
    supabase.from('modules').select('*').eq('package_id', pkg.id).order('sort_order'),
    supabase.from('lesson_outline').select('*').eq('package_id', pkg.id).order('sort_order'),
    supabase
      .from('testimonials')
      .select('*')
      .eq('package_id', pkg.id)
      .eq('status', 'published')
      .order('sort_order'),
  ]);

  return {
    pkg,
    modules: modules ?? [],
    outline: outline ?? [],
    testimonials: testimonials ?? [],
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadPackage(slug);
  if (!data) return { title: 'Paquete no encontrado' };

  const url = `/paquetes/${data.pkg.slug}`;
  const description = data.pkg.outcome ?? data.pkg.description ?? data.pkg.subtitle ?? undefined;

  return {
    title: data.pkg.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: data.pkg.title,
      description,
      ...(data.pkg.cover_url ? { images: [data.pkg.cover_url] } : {}),
    },
  };
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await loadPackage(slug);
  if (!data) notFound();

  const { pkg, modules, outline, testimonials } = data;
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;
  const access = await getAccessState();
  const owned = canAccessPackage(access, pkg);

  const totalSeconds = outline.reduce((sum, lesson) => sum + lesson.duration_seconds, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <JsonLd data={packageJsonLd(pkg, siteUrl, testimonials)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', url: siteUrl },
          { name: 'Paquetes', url: `${siteUrl}/paquetes` },
          { name: pkg.title, url: `${siteUrl}/paquetes/${pkg.slug}` },
        ])}
      />

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        {/* --------------------------------------------------------- CONTENIDO */}
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{pkg.category}</Badge>
            <Badge>{pkg.level}</Badge>
            <Badge>
              {outline.length} lecciones · {formatDuration(totalSeconds)}
            </Badge>
          </div>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight">{pkg.title}</h1>
          {pkg.subtitle && <p className="mt-2 text-lg text-brand-400">{pkg.subtitle}</p>}
          {pkg.description && <p className="mt-6 text-mist-200">{pkg.description}</p>}

          {pkg.features.length > 0 && (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {pkg.features.map((feature) => (
                <div key={feature.title} className="card-surface rounded-xl p-5">
                  <h3 className="font-semibold text-brand-400">{feature.title}</h3>
                  <p className="mt-2 text-sm text-mist-400">{feature.detail}</p>
                </div>
              ))}
            </div>
          )}

          <h2 className="mt-14 text-2xl font-bold tracking-tight">Temario</h2>
          <div className="mt-6 space-y-6">
            {modules.map((module) => {
              const lessons = outline.filter((lesson) => lesson.module_id === module.id);

              return (
                <div key={module.id} className="card-surface rounded-2xl p-6">
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  {module.summary && <p className="mt-1 text-sm text-mist-400">{module.summary}</p>}

                  <ul className="mt-4 divide-y divide-ink-800 border-t border-ink-800">
                    {lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-4 py-3 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          {lesson.title}
                          {lesson.is_preview && (
                            <Badge className="border-brand-600 text-brand-400">Gratis</Badge>
                          )}
                        </span>
                        <span className="shrink-0 text-mist-400">
                          {formatDuration(lesson.duration_seconds)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------ COMPRA */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card-surface rounded-2xl p-6">
            {owned ? (
              <>
                <p className="text-lg font-semibold text-brand-400">Ya tienes acceso</p>
                <p className="mt-2 text-sm text-mist-400">
                  Continúa donde lo dejaste desde tu biblioteca.
                </p>
                <ButtonLink href={`/biblioteca/${pkg.slug}`} size="lg" className="mt-6 w-full">
                  Ir al contenido
                </ButtonLink>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  {pkg.price_one_time_cents ? (
                    <>
                      <span className="text-3xl font-bold">
                        {formatPrice(pkg.price_one_time_cents, pkg.currency)}
                      </span>
                      {pkg.compare_at_price_cents && (
                        <span className="text-sm text-mist-400 line-through">
                          {formatPrice(pkg.compare_at_price_cents, pkg.currency)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl font-bold">Solo con membresía</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-mist-400">
                  Pago único · Acceso de por vida · Actualizaciones incluidas
                </p>

                {pkg.price_one_time_cents && pkg.stripe_price_id_one_time && (
                  <CheckoutButton
                    intent={{ kind: 'package', slug: pkg.slug }}
                    size="lg"
                    className="mt-6"
                  >
                    Comprar este paquete
                  </CheckoutButton>
                )}

                {pkg.included_in_subscription && (
                  <>
                    <div className="my-5 flex items-center gap-3 text-xs text-mist-400">
                      <span className="h-px flex-1 bg-ink-700" />o
                      <span className="h-px flex-1 bg-ink-700" />
                    </div>
                    <ButtonLink href="/precios" variant="secondary" size="lg" className="w-full">
                      Desbloquear todo con All Access
                    </ButtonLink>
                  </>
                )}

                <p className="mt-5 text-center text-xs text-mist-400">
                  Garantía de {GUARANTEE_DAYS} días. Sin preguntas.
                </p>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-mist-400">
            ¿Dudas antes de comprar?{' '}
            <Link href="/#faq" className="text-brand-400 hover:underline">
              Mira las preguntas frecuentes
            </Link>
          </p>
        </aside>
      </div>

      {testimonials.length > 0 && (
        <div className="-mx-4 mt-16">
          <Testimonials
            testimonials={testimonials}
            title="Resultados de quienes ya lo implementaron"
          />
        </div>
      )}
    </div>
  );
}
