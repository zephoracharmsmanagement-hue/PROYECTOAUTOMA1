import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BillingPortalButton } from '@/components/members/billing-portal-button';
import { Badge } from '@/components/ui/badge';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/cuenta');

  const [{ data: subscriptions }, { data: orders }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('id, status, current_period_end, cancel_at_period_end, plans(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, amount_cents, currency, status, created_at, packages(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Mi cuenta</h1>
      <p className="mt-2 text-sm text-mist-400">{user.email}</p>

      <section className="card-surface mt-10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Membresía</h2>

        {(subscriptions ?? []).length > 0 ? (
          <ul className="mt-4 space-y-4">
            {(subscriptions ?? []).map((sub) => (
              <li
                key={sub.id}
                className="flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  {(sub.plans as { name: string } | null)?.name ?? 'Plan'}
                  <Badge>{sub.status}</Badge>
                </span>
                <span className="text-mist-400">
                  {sub.cancel_at_period_end ? 'Finaliza el ' : 'Se renueva el '}
                  {sub.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString('es-ES')
                    : '—'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-mist-400">No tienes ninguna membresía activa.</p>
        )}

        <div className="mt-6">
          <BillingPortalButton />
        </div>
      </section>

      <section className="card-surface mt-6 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Compras</h2>

        {(orders ?? []).length > 0 ? (
          <ul className="mt-4 divide-y divide-ink-800 border-t border-ink-800">
            {(orders ?? []).map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span>{(order.packages as { title: string } | null)?.title ?? 'Paquete'}</span>
                <span className="flex items-center gap-3 text-mist-400">
                  {new Date(order.created_at).toLocaleDateString('es-ES')}
                  <span className="text-mist-50">
                    {formatPrice(order.amount_cents, order.currency)}
                  </span>
                  <Badge>{order.status}</Badge>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-mist-400">Aún no has realizado ninguna compra.</p>
        )}
      </section>
    </div>
  );
}
