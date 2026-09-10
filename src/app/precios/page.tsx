import type { Metadata } from 'next';
import { PricingCard } from '@/components/marketing/pricing-card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessState } from '@/lib/entitlements';
import { GUARANTEE_DAYS } from '@/config/site';
import { JsonLd } from '@/components/seo/json-ld';
import { subscriptionJsonLd } from '@/lib/seo/json-ld';
import { publicEnv } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Precios',
  description: 'Compra paquetes sueltos o desbloquea todo el catálogo con la membresía All Access.',
  alternates: { canonical: '/precios' },
};

export const revalidate = 300;

export default async function PricingPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: plans }, access] = await Promise.all([
    supabase.from('plans').select('*').eq('is_active', true).order('sort_order'),
    getAccessState(),
  ]);

  const list = plans ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {list.length > 0 && (
        <JsonLd data={subscriptionJsonLd(list, publicEnv.NEXT_PUBLIC_SITE_URL)} />
      )}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Elige cómo quieres avanzar</h1>
        <p className="mx-auto mt-4 max-w-2xl text-mist-400">
          Compra un paquete suelto y consérvalo de por vida, o activa All Access y desbloquea todo
          el catálogo más cada lanzamiento nuevo.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {list.map((plan, index) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            highlighted={index === list.length - 1}
            isCurrent={access.hasAllAccess}
          />
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-10 rounded-xl border border-dashed border-ink-700 p-8 text-center text-mist-400">
          No hay planes activos. Créalos en Supabase y enlázalos con tus precios de Stripe.
        </p>
      )}

      <p className="mt-10 text-center text-sm text-mist-400">
        Todos los planes incluyen garantía de {GUARANTEE_DAYS} días y cancelación en un clic desde
        tu cuenta.
      </p>
    </div>
  );
}
