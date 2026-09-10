import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { AffiliateForm } from '@/components/admin/affiliate-form';
import { Badge } from '@/components/ui/badge';
import { approvePendingCommissions, setReferralStatus } from '@/lib/admin/actions/affiliates';
import { requireAdmin } from '@/lib/admin/guard';
import { formatPrice } from '@/lib/utils';
import type { ReferralRow } from '@/types/database.types';

export const metadata: Metadata = { title: 'Afiliados' };

const STATUS_LABEL: Record<string, string> = {
  pending: 'pendiente',
  approved: 'aprobada',
  paid: 'pagada',
  void: 'anulada',
};

function sumBy(rows: ReferralRow[], status: string): number {
  return rows
    .filter((row) => row.status === status)
    .reduce((total, row) => total + row.commission_cents, 0);
}

export default async function AdminAffiliatesPage() {
  const { supabase } = await requireAdmin();

  const [{ data: affiliates }, { data: referrals }] = await Promise.all([
    supabase
      .from('affiliates')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false }),
    supabase
      .from('referrals')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const affiliateList = affiliates ?? [];
  const referralList = (referrals ?? []) as Array<
    ReferralRow & { profiles: { email: string } | null }
  >;

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold">Programa de afiliados</h2>
      <p className="mt-1 text-sm text-mist-400">
        Cada afiliado reparte enlaces con <code className="text-brand-400">?ref=SU_CODIGO</code>. La
        atribución dura 90 días desde el clic y, tras la primera compra, queda fijada en el perfil
        del cliente: sus renovaciones siguen generando comisión aunque la cookie caduque.
      </p>

      <p className="mt-4 rounded-xl border border-ink-700 bg-ink-900 p-4 text-sm text-mist-400">
        Los pagos a afiliados se hacen <strong>fuera de la plataforma</strong> (transferencia,
        PayPal, Wise). Aquí se lleva la cuenta de lo que se debe y se marca lo ya liquidado.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {affiliateList.map((affiliate) => {
          const own = referralList.filter((row) => row.affiliate_id === affiliate.id);
          const pending = sumBy(own, 'pending');
          const approved = sumBy(own, 'approved');
          const paid = sumBy(own, 'paid');

          return (
            <div key={affiliate.id}>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <Badge
                  className={affiliate.is_active ? 'border-brand-600 text-brand-400' : undefined}
                >
                  {affiliate.is_active ? 'activo' : 'inactivo'}
                </Badge>
                <code className="text-xs text-brand-400">?ref={affiliate.code}</code>
                <span className="text-mist-400">
                  {(affiliate.profiles as { email: string } | null)?.email ?? '—'}
                </span>
                <span className="text-mist-400">{affiliate.commission_pct}%</span>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
                <span className="text-mist-400">
                  Pendiente: <span className="text-amber-400">{formatPrice(pending)}</span>
                </span>
                <span className="text-mist-400">
                  Por pagar: <span className="text-brand-400">{formatPrice(approved)}</span>
                </span>
                <span className="text-mist-400">Pagado: {formatPrice(paid)}</span>

                {pending > 0 && (
                  <ActionButton
                    action={approvePendingCommissions}
                    fields={{ affiliate_id: affiliate.id }}
                    confirm="¿Aprobar todas las comisiones pendientes de este afiliado? Hazlo solo cuando haya pasado el periodo de garantía."
                  >
                    Aprobar pendientes
                  </ActionButton>
                )}
              </div>

              <AffiliateForm
                affiliate={affiliate}
                email={(affiliate.profiles as { email: string } | null)?.email}
              />
            </div>
          );
        })}
      </div>

      {affiliateList.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          Todavía no hay afiliados.
        </p>
      )}

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Dar de alta un afiliado</h3>
        <div className="mt-4">
          <AffiliateForm />
        </div>
      </div>

      <section className="mt-12">
        <h3 className="text-lg font-semibold">Comisiones</h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-ink-700 text-left text-mist-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Cliente</th>
                <th className="py-2 pr-4 font-medium">Venta</th>
                <th className="py-2 pr-4 font-medium">Comisión</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {referralList.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4 text-mist-400">
                    {new Date(row.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 pr-4">{row.profiles?.email ?? '—'}</td>
                  <td className="py-3 pr-4 tabular-nums">
                    {formatPrice(row.amount_cents, row.currency)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums font-semibold">
                    {formatPrice(row.commission_cents, row.currency)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      className={
                        row.status === 'paid' ? 'border-brand-600 text-brand-400' : undefined
                      }
                    >
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <span className="flex flex-wrap gap-2">
                      {row.status === 'pending' && (
                        <ActionButton
                          action={setReferralStatus}
                          fields={{ id: row.id, status: 'approved' }}
                        >
                          Aprobar
                        </ActionButton>
                      )}
                      {row.status === 'approved' && (
                        <ActionButton
                          action={setReferralStatus}
                          fields={{ id: row.id, status: 'paid' }}
                          confirm="¿Marcar como pagada? Hazlo solo cuando la transferencia esté hecha."
                        >
                          Marcar pagada
                        </ActionButton>
                      )}
                      {row.status !== 'void' && row.status !== 'paid' && (
                        <ActionButton
                          action={setReferralStatus}
                          fields={{ id: row.id, status: 'void' }}
                          confirm="¿Anular esta comisión?"
                          variant="ghost"
                        >
                          Anular
                        </ActionButton>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {referralList.length === 0 && (
          <p className="mt-4 text-sm text-mist-400">Todavía no hay comisiones generadas.</p>
        )}
      </section>
    </div>
  );
}
