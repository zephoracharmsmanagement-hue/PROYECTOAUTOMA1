import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageCard } from '@/components/marketing/package-card';
import { LeadForm } from '@/components/marketing/lead-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessState, canAccessPackage } from '@/lib/entitlements';
import { GUARANTEE_DAYS, siteConfig } from '@/config/site';

export const revalidate = 300;

const STEPS = [
  {
    title: '1. Elige tu sistema',
    detail:
      'Cada paquete resuelve un problema concreto de tu tienda: validar producto, automatizar la atención, escalar con ads.',
  },
  {
    title: '2. Míralo hacerse en pantalla',
    detail:
      'Video paso a paso, sin teoría de relleno. Se implementa delante de ti, con las plantillas ya listas.',
  },
  {
    title: '3. Cópialo en tu negocio',
    detail: 'Descargas los recursos, los conectas a tu tienda y quedas operando el mismo día.',
  },
];

const FAQ = [
  {
    q: '¿Necesito experiencia previa?',
    a: 'No para los paquetes de nivel principiante: empiezan desde la configuración de cero. Los de nivel avanzado asumen que ya tienes una tienda vendiendo.',
  },
  {
    q: '¿Pago único o suscripción?',
    a: 'Ambos. Puedes comprar un paquete suelto y conservarlo de por vida, o activar la membresía All Access y desbloquear todo el catálogo, incluidos los lanzamientos nuevos.',
  },
  {
    q: '¿Qué pasa si cancelo la membresía?',
    a: 'Conservas el acceso hasta el final del periodo que ya pagaste. Los paquetes que compraste en pago único siguen siendo tuyos para siempre.',
  },
  {
    q: '¿Hay garantía?',
    a: `Sí. Tienes ${GUARANTEE_DAYS} días para pedir el reembolso completo escribiendo a ${siteConfig.support.email}.`,
  },
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: packages }, access] = await Promise.all([
    supabase
      .from('packages')
      .select(
        'id, slug, title, subtitle, outcome, category, level, price_one_time_cents, compare_at_price_cents, currency, included_in_subscription',
      )
      .eq('status', 'published')
      .order('sort_order')
      .limit(3),
    getAccessState(),
  ]);

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="hero-glow border-b border-ink-800">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <Badge>Ecommerce · Dropshipping · Automatización con IA</Badge>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Sistemas listos para copiar que hacen vender a tu ecommerce
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-mist-400">
            Nada de cursos infinitos. Cada paquete es una implementación grabada paso a paso, con
            plantillas y automatizaciones que instalas hoy mismo.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/paquetes" size="lg">
              Ver los paquetes
            </ButtonLink>
            <ButtonLink href="/precios" variant="secondary" size="lg">
              Membresía All Access
            </ButtonLink>
          </div>

          <p className="mt-6 text-sm text-mist-400">
            Garantía de {GUARANTEE_DAYS} días · Acceso inmediato · Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------- PAQUETES */}
      <section className="border-b border-ink-800 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Paquetes destacados</h2>
              <p className="mt-2 text-mist-400">
                Empieza por el que resuelva tu cuello de botella.
              </p>
            </div>
            <Link href="/paquetes" className="text-sm text-brand-400 hover:text-brand-500">
              Ver todo el catálogo →
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(packages ?? []).map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                owned={canAccessPackage(access, {
                  id: pkg.id,
                  included_in_subscription: pkg.included_in_subscription,
                })}
              />
            ))}
          </div>

          {(packages ?? []).length === 0 && (
            <p className="mt-10 rounded-xl border border-dashed border-ink-700 p-8 text-center text-mist-400">
              Todavía no hay paquetes publicados. Carga el seed de la base de datos o publica el
              primero desde Supabase.
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------ COMO FUNCIONA */}
      <section id="como-funciona" className="border-b border-ink-800 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold tracking-tight">Cómo funciona</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="card-surface rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-brand-400">{step.title}</h3>
                <p className="mt-3 text-sm text-mist-400">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ CAPTURA */}
      <section className="border-b border-ink-800 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">¿Prefieres verlo antes de pagar?</h2>
          <p className="max-w-xl text-mist-400">
            Te enviamos una clase completa del paquete de dropshipping, sin coste y sin recortes.
          </p>
          <LeadForm source="landing-hero" />
        </div>
      </section>

      {/* ---------------------------------------------------------------- FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
          <div className="mt-8 divide-y divide-ink-800 border-y border-ink-800">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span
                      aria-hidden
                      className="text-mist-400 group-open:rotate-45 transition-transform"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-mist-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
