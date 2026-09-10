import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { GrantAccessForm } from '@/components/admin/grant-access-form';
import { Badge } from '@/components/ui/badge';
import { restoreAccess, revokeAccess } from '@/lib/admin/actions/entitlements';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = { title: 'Alumnos' };

const SOURCE_LABEL: Record<string, string> = {
  purchase: 'compra',
  subscription: 'membresía',
  manual_grant: 'manual',
};

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: packages } = await supabase
    .from('packages')
    .select('id, title')
    .order('sort_order');

  let query = supabase
    .from('entitlements')
    .select('id, kind, status, source, granted_at, expires_at, profiles(email), packages(title)')
    .order('granted_at', { ascending: false })
    .limit(100);

  // Búsqueda por email a través de la relación con profiles.
  if (q) query = query.ilike('profiles.email', `%${q}%`);

  const { data: entitlements } = await query;

  const rows = (entitlements ?? []).filter((row) => (q ? row.profiles !== null : true));

  return (
    <div className="flex flex-col gap-8">
      <GrantAccessForm packages={packages ?? []} />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Accesos concedidos</h2>
            <p className="mt-1 text-sm text-mist-400">
              Revocar no borra la fila: conserva el rastro de por qué alguien tuvo acceso.
            </p>
          </div>

          <form method="get" className="flex gap-2">
            <label htmlFor="q" className="sr-only">
              Buscar por email
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Buscar por email…"
              className="h-9 rounded-lg border border-ink-600 bg-ink-950 px-3 text-sm outline-none placeholder:text-mist-400 focus:border-brand-500"
            />
            <button
              type="submit"
              className="h-9 rounded-lg border border-ink-600 bg-ink-800 px-3 text-sm hover:bg-ink-700"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-ink-700 text-left text-mist-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Alumno</th>
                <th className="py-2 pr-4 font-medium">Acceso</th>
                <th className="py-2 pr-4 font-medium">Origen</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4">
                    {(row.profiles as { email: string } | null)?.email ?? '—'}
                  </td>
                  <td className="py-3 pr-4">
                    {row.kind === 'all_access'
                      ? 'Membresía All Access'
                      : ((row.packages as { title: string } | null)?.title ?? 'Paquete eliminado')}
                  </td>
                  <td className="py-3 pr-4 text-mist-400">
                    {SOURCE_LABEL[row.source] ?? row.source}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      className={
                        row.status === 'active' ? 'border-brand-600 text-brand-400' : undefined
                      }
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    {row.status === 'active' ? (
                      <ActionButton
                        action={revokeAccess}
                        fields={{ id: row.id }}
                        confirm="¿Revocar este acceso? El alumno dejará de ver el contenido de inmediato."
                        variant="ghost"
                      >
                        Revocar
                      </ActionButton>
                    ) : (
                      <ActionButton action={restoreAccess} fields={{ id: row.id }}>
                        Restaurar
                      </ActionButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="mt-4 text-sm text-mist-400">
            {q ? 'Ningún acceso coincide con esa búsqueda.' : 'Todavía no hay accesos concedidos.'}
          </p>
        )}
      </section>
    </div>
  );
}
