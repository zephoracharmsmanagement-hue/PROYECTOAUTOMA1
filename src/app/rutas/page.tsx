import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Rutas de aprendizaje',
  description:
    'Itinerarios que encadenan varios paquetes en el orden correcto, con el lote a mejor precio.',
  alternates: { canonical: '/rutas' },
};

export const revalidate = 300;

export default async function PathsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: paths } = await supabase
    .from('paths')
    .select('*, path_packages(package_id)')
    .eq('status', 'published')
    .order('sort_order');

  const list = paths ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Rutas de aprendizaje</h1>
      <p className="mt-3 max-w-2xl text-mist-400">
        Cada ruta encadena varios paquetes en el orden que tiene sentido implementarlos. Se compran
        como lote, a mejor precio que por separado.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {list.map((path) => {
          const count = (path.path_packages as Array<{ package_id: string }> | null)?.length ?? 0;

          return (
            <Link
              key={path.id}
              href={`/rutas/${path.slug}`}
              className="card-surface group flex flex-col rounded-2xl p-6 transition-colors"
            >
              <Badge>{count} paquete(s)</Badge>

              <h2 className="mt-4 text-xl font-bold group-hover:text-brand-400">{path.title}</h2>
              {path.subtitle && <p className="mt-1 text-sm text-brand-400">{path.subtitle}</p>}
              {path.outcome && <p className="mt-3 flex-1 text-sm text-mist-400">{path.outcome}</p>}

              <p className="mt-6 text-lg font-bold">
                {path.price_one_time_cents
                  ? formatPrice(path.price_one_time_cents, path.currency)
                  : 'Incluida en la membresía'}
              </p>
            </Link>
          );
        })}
      </div>

      {list.length === 0 && (
        <p className="mt-10 rounded-xl border border-dashed border-ink-700 p-8 text-center text-mist-400">
          Todavía no hay rutas publicadas.
        </p>
      )}
    </div>
  );
}
