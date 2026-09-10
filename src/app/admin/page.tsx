import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Resumen' };

interface Metrics {
  revenue_cents_total: number;
  revenue_cents_last_30d: number;
  orders_paid: number;
  orders_refunded: number;
  active_members: number;
  canceling_members: number;
  customers: number;
  leads: number;
  published_packages: number;
  draft_packages: number;
}

/** Un price id que sigue siendo el marcador del seed cobraría de forma incorrecta. */
function isPlaceholderPrice(priceId: string | null): boolean {
  return !priceId || priceId.includes('REEMPLAZAR');
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <p className="text-sm text-mist-400">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-mist-400">{hint}</p>}
    </div>
  );
}

export default async function AdminHomePage() {
  const { supabase } = await requireAdmin();

  const [{ data: metricsData }, { data: packages }, { data: plans }, { data: lessons }] =
    await Promise.all([
      supabase.rpc('admin_dashboard_metrics'),
      supabase
        .from('packages')
        .select('id, slug, title, status, price_one_time_cents, stripe_price_id_one_time')
        .order('sort_order'),
      supabase.from('plans').select('id, name, stripe_price_id, is_active'),
      supabase.from('lessons').select('id, title, video_asset_id, provider'),
    ]);

  const metrics = (metricsData ?? null) as Metrics | null;

  // ---------------------------------------------------------------- avisos
  const problems: Array<{ text: string; href: string }> = [];

  for (const pkg of packages ?? []) {
    if (pkg.status !== 'published') continue;

    if (pkg.price_one_time_cents && isPlaceholderPrice(pkg.stripe_price_id_one_time)) {
      problems.push({
        text: `"${pkg.title}" está publicado con precio pero sin un price id real de Stripe: el botón de compra fallará.`,
        href: `/admin/paquetes/${pkg.id}`,
      });
    }
  }

  for (const plan of plans ?? []) {
    if (plan.is_active && isPlaceholderPrice(plan.stripe_price_id)) {
      problems.push({
        text: `El plan "${plan.name}" está activo con un price id de marcador. Nadie podrá suscribirse.`,
        href: '/admin/planes',
      });
    }
  }

  const lessonsWithoutVideo = (lessons ?? []).filter(
    (lesson) => lesson.provider !== 'none' && !lesson.video_asset_id,
  ).length;

  if (lessonsWithoutVideo > 0) {
    problems.push({
      text: `${lessonsWithoutVideo} lección(es) no tienen video asignado. Los alumnos verán un error al abrirlas.`,
      href: '/admin/paquetes',
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {problems.length > 0 && (
        <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
          <h2 className="font-semibold text-amber-300">
            {problems.length} cosa(s) que bloquean la venta
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-amber-100/90">
            {problems.map((problem) => (
              <li key={problem.text}>
                <Link href={problem.href} className="hover:underline">
                  {problem.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Negocio</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Ingresos totales"
            value={formatPrice(metrics?.revenue_cents_total ?? 0)}
            hint="Solo pagos únicos cobrados"
          />
          <Stat
            label="Últimos 30 días"
            value={formatPrice(metrics?.revenue_cents_last_30d ?? 0)}
            hint={`${metrics?.orders_paid ?? 0} venta(s) en total`}
          />
          <Stat
            label="Miembros activos"
            value={String(metrics?.active_members ?? 0)}
            hint={
              metrics?.canceling_members
                ? `${metrics.canceling_members} con baja programada`
                : 'Sin bajas programadas'
            }
          />
          <Stat
            label="Clientes con acceso"
            value={String(metrics?.customers ?? 0)}
            hint={`${metrics?.orders_refunded ?? 0} reembolso(s)`}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Catálogo</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Paquetes publicados" value={String(metrics?.published_packages ?? 0)} />
          <Stat label="En borrador" value={String(metrics?.draft_packages ?? 0)} />
          <Stat label="Lecciones sin video" value={String(lessonsWithoutVideo)} />
          <Stat label="Leads captados" value={String(metrics?.leads ?? 0)} />
        </div>
      </section>

      {!metrics && (
        <p className="rounded-xl border border-dashed border-ink-700 p-6 text-sm text-mist-400">
          No se pudieron cargar las métricas. Comprueba que la migración
          <code className="mx-1 text-brand-400">20260910000000_admin_write_policies.sql</code>
          está aplicada.
        </p>
      )}
    </div>
  );
}
