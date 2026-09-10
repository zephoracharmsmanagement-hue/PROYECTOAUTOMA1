import type { Metadata } from 'next';
import { PackageCard } from '@/components/marketing/package-card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessState, canAccessPackage } from '@/lib/entitlements';

export const metadata: Metadata = {
  title: 'Catálogo de paquetes',
  description:
    'Todos los sistemas de ecommerce, dropshipping y automatización disponibles para implementar hoy.',
};

export const revalidate = 300;

export default async function PackagesPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: packages }, access] = await Promise.all([
    supabase
      .from('packages')
      .select(
        'id, slug, title, subtitle, outcome, category, level, price_one_time_cents, compare_at_price_cents, currency, included_in_subscription',
      )
      .eq('status', 'published')
      .order('sort_order'),
    getAccessState(),
  ]);

  const list = packages ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Catálogo completo</h1>
      <p className="mt-3 max-w-2xl text-mist-400">
        Cada paquete se compra por separado o se desbloquea entero con la membresía All Access.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((pkg) => (
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

      {list.length === 0 && (
        <p className="mt-10 rounded-xl border border-dashed border-ink-700 p-8 text-center text-mist-400">
          Aún no hay paquetes publicados.
        </p>
      )}
    </div>
  );
}
