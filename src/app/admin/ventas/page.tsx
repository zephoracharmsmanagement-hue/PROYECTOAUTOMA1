import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { requireAdmin } from '@/lib/admin/guard';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Ventas' };

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

export default async function AdminSalesPage() {
  const { supabase } = await requireAdmin();

  const [{ data: orders }, { data: subscriptions }, { data: events }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, amount_cents, currency, status, created_at, profiles(email), packages(title)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('subscriptions')
      .select(
        'id, status, current_period_end, cancel_at_period_end, created_at, profiles(email), plans(name)',
      )
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('webhook_events')
      .select('id, type, stripe_event_id, processed_at')
      .order('processed_at', { ascending: false })
      .limit(15),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-xl font-semibold">Últimas compras</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-ink-700 text-left text-mist-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Cliente</th>
                <th className="py-2 pr-4 font-medium">Paquete</th>
                <th className="py-2 pr-4 font-medium">Importe</th>
                <th className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {(orders ?? []).map((order) => (
                <tr key={order.id}>
                  <td className="py-3 pr-4 text-mist-400">{formatDate(order.created_at)}</td>
                  <td className="py-3 pr-4">
                    {(order.profiles as { email: string } | null)?.email ?? '—'}
                  </td>
                  <td className="py-3 pr-4">
                    {(order.packages as { title: string } | null)?.title ?? '—'}
                  </td>
                  <td className="py-3 pr-4">{formatPrice(order.amount_cents, order.currency)}</td>
                  <td className="py-3">
                    <Badge
                      className={
                        order.status === 'paid' ? 'border-brand-600 text-brand-400' : undefined
                      }
                    >
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(orders ?? []).length === 0 && (
          <p className="mt-4 text-sm text-mist-400">Todavía no hay compras registradas.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Suscripciones</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-ink-700 text-left text-mist-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Alta</th>
                <th className="py-2 pr-4 font-medium">Cliente</th>
                <th className="py-2 pr-4 font-medium">Plan</th>
                <th className="py-2 pr-4 font-medium">Renueva</th>
                <th className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {(subscriptions ?? []).map((sub) => (
                <tr key={sub.id}>
                  <td className="py-3 pr-4 text-mist-400">{formatDate(sub.created_at)}</td>
                  <td className="py-3 pr-4">
                    {(sub.profiles as { email: string } | null)?.email ?? '—'}
                  </td>
                  <td className="py-3 pr-4">
                    {(sub.plans as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-mist-400">
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString('es-ES')
                      : '—'}
                    {sub.cancel_at_period_end && (
                      <span className="ml-2 text-xs text-amber-400">baja programada</span>
                    )}
                  </td>
                  <td className="py-3">
                    <Badge
                      className={
                        sub.status === 'active' || sub.status === 'trialing'
                          ? 'border-brand-600 text-brand-400'
                          : undefined
                      }
                    >
                      {sub.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(subscriptions ?? []).length === 0 && (
          <p className="mt-4 text-sm text-mist-400">Todavía no hay suscripciones.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Últimos eventos de Stripe</h2>
        <p className="mt-1 text-sm text-mist-400">
          Si un cliente pagó y no tiene acceso, aquí se ve si su evento llegó a procesarse.
        </p>

        <ul className="mt-4 divide-y divide-ink-800 border-t border-ink-800 text-sm">
          {(events ?? []).map((event) => (
            <li key={event.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="font-mono text-xs text-mist-200">{event.type}</span>
              <span className="text-xs text-mist-400">{formatDate(event.processed_at)}</span>
            </li>
          ))}
        </ul>

        {(events ?? []).length === 0 && (
          <p className="mt-4 text-sm text-mist-400">
            Ningún evento procesado todavía. Si ya hiciste una compra de prueba, revisa la
            configuración del webhook.
          </p>
        )}
      </section>
    </div>
  );
}
