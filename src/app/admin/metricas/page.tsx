import type { Metadata } from 'next';
import Link from 'next/link';
import { RevenueChart, type RevenuePoint } from '@/components/admin/charts/revenue-chart';
import { requireAdmin } from '@/lib/admin/guard';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Métricas' };

interface PackageFunnel {
  package_id: string;
  title: string;
  slug: string;
  started: number;
  paid: number;
  revenue_cents: number;
}

interface BusinessMetrics {
  months: number;
  series: RevenuePoint[];
  mrr_cents: number;
  arr_cents: number;
  active_subscriptions: number;
  churned_30d: number;
  churn_rate_pct: number | null;
  churn_sample: number;
  customers: number;
  revenue_cents_total: number;
  arpu_cents: number | null;
  ltv_cents: number | null;
  packages: PackageFunnel[];
}

/**
 * Umbral por debajo del cual una tasa es ruido estadístico.
 *
 * Con 5 suscriptores, perder uno es un churn del 20%: el número es correcto y no
 * significa nada. Decirlo es más útil que pintar la cifra con aire de certeza.
 */
const MIN_SAMPLE = 20;

function Stat({
  label,
  value,
  hint,
  muted = false,
}: {
  label: string;
  value: string;
  hint?: string;
  muted?: boolean;
}) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <p className="text-sm text-mist-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${muted ? 'text-mist-400' : ''}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-mist-400">{hint}</p>}
    </div>
  );
}

/** Barra de proporción: pista y relleno salen de la misma rampa de color. */
function ConversionMeter({ rate }: { rate: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-700">
        <span
          className="block h-full rounded-full bg-brand-600"
          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
        />
      </span>
      <span className="tabular-nums">{rate.toFixed(0)}%</span>
    </span>
  );
}

export default async function AdminMetricsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc('admin_business_metrics', { p_months: 12 });
  const metrics = (data ?? null) as BusinessMetrics | null;

  if (!metrics) {
    return (
      <p className="rounded-xl border border-dashed border-ink-700 p-8 text-sm text-mist-400">
        No se pudieron cargar las métricas
        {error ? `: ${error.message}` : ''}. Comprueba que la migración{' '}
        <code className="text-brand-400">20260910030200_business_metrics.sql</code> está aplicada.
      </p>
    );
  }

  const churnReliable = metrics.churn_sample >= MIN_SAMPLE;

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-lg font-semibold">Ingresos recurrentes</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="MRR"
            value={formatPrice(metrics.mrr_cents)}
            hint="Planes anuales prorrateados a mes"
          />
          <Stat label="ARR" value={formatPrice(metrics.arr_cents)} hint="MRR × 12" />
          <Stat
            label="Suscripciones activas"
            value={String(metrics.active_subscriptions)}
            hint={`${metrics.churned_30d} baja(s) en 30 días`}
          />
          <Stat
            label="Churn mensual"
            value={metrics.churn_rate_pct === null ? '—' : `${metrics.churn_rate_pct}%`}
            muted={!churnReliable}
            hint={
              churnReliable
                ? `Sobre ${metrics.churn_sample} suscripciones`
                : `Muestra de ${metrics.churn_sample}: aún no es significativo`
            }
          />
        </div>

        {!churnReliable && metrics.churn_rate_pct !== null && (
          <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            Con menos de {MIN_SAMPLE} suscripciones, el churn y el LTV oscilan enormemente con cada
            alta o baja. Sirven para detectar una tendencia gruesa, no para tomar decisiones de
            precio.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Valor del cliente</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Ingresos totales" value={formatPrice(metrics.revenue_cents_total)} />
          <Stat label="Clientes con acceso" value={String(metrics.customers)} />
          <Stat
            label="ARPU"
            value={metrics.arpu_cents === null ? '—' : formatPrice(metrics.arpu_cents)}
            hint="Ingreso medio acumulado por cliente"
          />
          <Stat
            label="LTV estimado"
            value={metrics.ltv_cents === null ? '—' : formatPrice(metrics.ltv_cents)}
            muted={!churnReliable}
            hint={
              metrics.ltv_cents === null
                ? 'Sin bajas registradas no hay estimación posible'
                : 'ARPU ÷ tasa de cancelación'
            }
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Ingresos por mes</h2>
        <p className="mt-1 text-sm text-mist-400">
          Últimos {metrics.months} meses. El pago único se contabiliza al cobrarse; la suscripción,
          en cada factura pagada.
        </p>

        <div className="card-surface mt-4 rounded-2xl p-6">
          <RevenueChart data={metrics.series} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Embudo por paquete</h2>
        <p className="mt-1 text-sm text-mist-400">
          Conversión de <strong>checkout iniciado a pagado</strong>. No es visita → compra: las
          visitas viven en tu proveedor de analítica, aquí solo hay datos de pago, que son exactos.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-ink-700 text-left text-mist-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Paquete</th>
                <th className="py-2 pr-4 font-medium">Checkouts</th>
                <th className="py-2 pr-4 font-medium">Pagados</th>
                <th className="py-2 pr-4 font-medium">Conversión</th>
                <th className="py-2 font-medium">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {metrics.packages.map((row) => {
                const rate = row.started > 0 ? (row.paid / row.started) * 100 : 0;

                return (
                  <tr key={row.package_id}>
                    <td className="py-3 pr-4">
                      <Link href={`/paquetes/${row.slug}`} className="hover:text-brand-400">
                        {row.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-mist-400">{row.started}</td>
                    <td className="py-3 pr-4 tabular-nums">{row.paid}</td>
                    <td className="py-3 pr-4">
                      {row.started > 0 ? (
                        <ConversionMeter rate={rate} />
                      ) : (
                        <span className="text-mist-400">—</span>
                      )}
                    </td>
                    <td className="py-3 tabular-nums">{formatPrice(row.revenue_cents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {metrics.packages.length === 0 && (
          <p className="mt-4 text-sm text-mist-400">Todavía no hay paquetes que medir.</p>
        )}
      </section>
    </div>
  );
}
