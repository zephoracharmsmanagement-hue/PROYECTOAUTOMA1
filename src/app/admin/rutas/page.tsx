import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { PathForm } from '@/components/admin/path-form';
import { Badge } from '@/components/ui/badge';
import { deletePath } from '@/lib/admin/actions/paths';
import { requireAdmin } from '@/lib/admin/guard';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Rutas' };

export default async function AdminPathsPage() {
  const { supabase } = await requireAdmin();

  const { data: paths } = await supabase
    .from('paths')
    .select('*, path_packages(note, sort_order, packages(slug))')
    .order('sort_order');

  const list = paths ?? [];

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold">Rutas de aprendizaje</h2>
      <p className="mt-1 text-sm text-mist-400">
        Una ruta encadena varios paquetes y se vende como lote. Comprarla concede acceso a todos sus
        paquetes de una vez.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {list.map((path) => {
          const rows = (path.path_packages ?? []) as Array<{
            note: string | null;
            sort_order: number;
            packages: { slug: string } | null;
          }>;

          const members = rows
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((row) => `${row.packages?.slug ?? ''}${row.note ? ` | ${row.note}` : ''}`)
            .filter((line) => line.trim().length > 0)
            .join('\n');

          return (
            <div key={path.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                <Badge
                  className={
                    path.status === 'published' ? 'border-brand-600 text-brand-400' : undefined
                  }
                >
                  {path.status}
                </Badge>
                <span className="text-mist-400">{path.title}</span>
                <span className="text-mist-400">{rows.length} paquete(s)</span>
                {path.price_one_time_cents && (
                  <span className="text-mist-400">
                    {formatPrice(path.price_one_time_cents, path.currency)}
                  </span>
                )}
                <ActionButton
                  action={deletePath}
                  fields={{ id: path.id }}
                  confirm={`¿Eliminar la ruta "${path.title}"? Los paquetes no se tocan.`}
                  variant="ghost"
                >
                  Eliminar
                </ActionButton>
              </div>
              <PathForm path={path} members={members} />
            </div>
          );
        })}
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          Todavía no hay rutas.
        </p>
      )}

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Crear ruta</h3>
        <div className="mt-4">
          <PathForm />
        </div>
      </div>
    </div>
  );
}
