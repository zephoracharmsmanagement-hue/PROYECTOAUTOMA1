import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = { title: 'Leads' };

export default async function AdminLeadsPage() {
  const { supabase } = await requireAdmin();

  const { data: leads } = await supabase
    .from('leads')
    .select('id, email, source, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const list = leads ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Leads captados</h2>
          <p className="mt-1 text-sm text-mist-400">
            Se muestran los 200 más recientes. La exportación incluye todos.
          </p>
        </div>
        <ButtonLink href="/admin/leads/export" variant="secondary" prefetch={false}>
          Exportar CSV
        </ButtonLink>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-ink-700 text-left text-mist-400">
            <tr>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Origen</th>
              <th className="py-2 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {list.map((lead) => (
              <tr key={lead.id}>
                <td className="py-3 pr-4">{lead.email}</td>
                <td className="py-3 pr-4 text-mist-400">{lead.source}</td>
                <td className="py-3 text-mist-400">
                  {new Date(lead.created_at).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-10 text-center text-sm text-mist-400">
          Todavía no hay leads. El formulario de la landing los alimenta.
        </p>
      )}
    </div>
  );
}
