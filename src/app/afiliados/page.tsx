import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CopyLinkButton } from '@/components/members/copy-link-button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { formatPrice } from '@/lib/utils';
import { REFERRAL_PARAM } from '@/lib/affiliates.shared';
import type { ReferralRow } from '@/types/database.types';

export const metadata: Metadata = { title: 'Mis comisiones', robots: { index: false } };
export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending: 'pendiente',
  approved: 'por pagar',
  paid: 'pagada',
  void: 'anulada',
};

function sumBy(rows: ReferralRow[], status: string): number {
  return rows
    .filter((row) => row.status === status)
    .reduce((total, row) => total + row.commission_cents, 0);
}

/**
 * Panel del propio afiliado.
 *
 * Las políticas RLS ya limitan `affiliates` y `referrals` a las filas de quien
 * consulta, así que esta página no necesita filtrar por seguridad: filtra por
 * conveniencia y la base de datos garantiza el resto.
 */
export default async function AffiliateDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/afiliados');

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!affiliate) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Programa de afiliados</h1>
        <p className="mt-4 text-mist-400">
          Todavía no formas parte del programa. Escríbenos si quieres recomendar los paquetes y
          llevarte una comisión por cada venta.
        </p>
      </div>
    );
  }

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const list = (referrals ?? []) as ReferralRow[];
  const link = `${publicEnv.NEXT_PUBLIC_SITE_URL}/?${REFERRAL_PARAM}=${affiliate.code}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Mis comisiones</h1>
      <p className="mt-2 text-mist-400">
        Comisión del {affiliate.commission_pct}% sobre cada venta que llegue por tu enlace,
        incluidas las renovaciones de suscripción.
      </p>

      <section className="card-surface mt-8 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Tu enlace</h2>
        <p className="mt-1 text-sm text-mist-400">
          La atribución dura 90 días desde el clic. Puedes añadir{' '}
          <code className="text-brand-400">
            ?{REFERRAL_PARAM}={affiliate.code}
          </code>{' '}
          a cualquier página del sitio, no solo a la portada.
        </p>

        <div className="mt-4">
          <CopyLinkButton value={link} />
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card-surface rounded-2xl p-5">
          <p className="text-sm text-mist-400">Pendiente de aprobación</p>
          <p className="mt-2 text-2xl font-bold">{formatPrice(sumBy(list, 'pending'))}</p>
          <p className="mt-1 text-xs text-mist-400">Durante el periodo de garantía</p>
        </div>
        <div className="card-surface rounded-2xl p-5">
          <p className="text-sm text-mist-400">Por cobrar</p>
          <p className="mt-2 text-2xl font-bold text-brand-400">
            {formatPrice(sumBy(list, 'approved'))}
          </p>
        </div>
        <div className="card-surface rounded-2xl p-5">
          <p className="text-sm text-mist-400">Cobrado</p>
          <p className="mt-2 text-2xl font-bold">{formatPrice(sumBy(list, 'paid'))}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Historial</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b border-ink-700 text-left text-mist-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Venta</th>
                <th className="py-2 pr-4 font-medium">Tu comisión</th>
                <th className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {list.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4 text-mist-400">
                    {new Date(row.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-mist-400">
                    {formatPrice(row.amount_cents, row.currency)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums font-semibold">
                    {formatPrice(row.commission_cents, row.currency)}
                  </td>
                  <td className="py-3">
                    <Badge
                      className={
                        row.status === 'paid' ? 'border-brand-600 text-brand-400' : undefined
                      }
                    >
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {list.length === 0 && (
          <p className="mt-4 text-sm text-mist-400">
            Todavía no hay ventas por tu enlace. Compártelo y aparecerán aquí.
          </p>
        )}
      </section>
    </div>
  );
}
