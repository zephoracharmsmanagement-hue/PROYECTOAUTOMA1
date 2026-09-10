import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DunningNotice } from '@/components/members/dunning-notice';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessState, canAccessPackage } from '@/lib/entitlements';

export const metadata: Metadata = { title: 'Mi biblioteca' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const access = await getAccessState();
  if (!access.userId) redirect('/login?next=/dashboard');

  const supabase = await createSupabaseServerClient();

  const [{ data: packages }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('packages')
      .select('id, slug, title, subtitle, category, level, included_in_subscription')
      .eq('status', 'published')
      .order('sort_order'),
    supabase
      .from('subscriptions')
      .select('status, dunning_attempts, grace_until, current_period_end')
      .eq('user_id', access.userId),
  ]);

  const owned = (packages ?? []).filter((pkg) => canAccessPackage(access, pkg));
  const locked = (packages ?? []).filter((pkg) => !canAccessPackage(access, pkg));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {subscriptions && subscriptions.length > 0 && (
        <div className="mb-8">
          <DunningNotice subscriptions={subscriptions} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi biblioteca</h1>
          <p className="mt-2 text-mist-400">
            {access.hasAllAccess
              ? 'Membresía All Access activa: todo el catálogo está desbloqueado.'
              : `Tienes ${owned.length} paquete(s) disponibles.`}
          </p>
        </div>
        <ButtonLink href="/cuenta" variant="secondary" size="sm">
          Facturación
        </ButtonLink>
      </div>

      {owned.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {owned.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/biblioteca/${pkg.slug}`}
              className="card-surface group rounded-2xl p-6 transition-colors"
            >
              <Badge>{pkg.category}</Badge>
              <h2 className="mt-4 text-lg font-bold group-hover:text-brand-400">{pkg.title}</h2>
              {pkg.subtitle && <p className="mt-1 text-sm text-mist-400">{pkg.subtitle}</p>}
              <p className="mt-6 text-sm font-semibold text-brand-400">Continuar →</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-ink-700 p-10 text-center">
          <p className="text-mist-400">Todavía no tienes ningún paquete.</p>
          <ButtonLink href="/paquetes" className="mt-6">
            Explorar el catálogo
          </ButtonLink>
        </div>
      )}

      {locked.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight">Todavía no incluidos</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {locked.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/paquetes/${pkg.slug}`}
                className="card-surface rounded-2xl p-6 opacity-70 transition-opacity hover:opacity-100"
              >
                <Badge>{pkg.category}</Badge>
                <h3 className="mt-4 font-semibold">{pkg.title}</h3>
                <p className="mt-4 text-sm text-brand-400">Ver cómo desbloquearlo →</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
