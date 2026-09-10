import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionButton } from '@/components/admin/action-button';
import { CurriculumEditor } from '@/components/admin/curriculum-editor';
import { PackageForm } from '@/components/admin/package-form';
import { Badge } from '@/components/ui/badge';
import { deletePackage, setPackageStatus } from '@/lib/admin/actions/packages';
import { reindexPackage } from '@/lib/admin/actions/content-index';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = { title: 'Editar paquete' };

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: pkg } = await supabase.from('packages').select('*').eq('id', id).maybeSingle();
  if (!pkg) notFound();

  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('package_id', pkg.id)
    .order('sort_order');

  // Se piden todas las lecciones del paquete en una sola consulta y se reparten
  // por módulo en el cliente: evita una consulta por módulo.
  const moduleIds = (modules ?? []).map((module) => module.id);

  const { data: lessons } = moduleIds.length
    ? await supabase.from('lessons').select('*').in('module_id', moduleIds).order('sort_order')
    : { data: [] };

  return (
    <div className="max-w-4xl">
      <Link href="/admin/paquetes" className="text-sm text-mist-400 hover:text-mist-50">
        ← Paquetes
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{pkg.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              className={pkg.status === 'published' ? 'border-brand-600 text-brand-400' : undefined}
            >
              {pkg.status}
            </Badge>
            <Link
              href={`/paquetes/${pkg.slug}`}
              className="text-xs text-mist-400 hover:text-mist-50"
            >
              Ver ficha pública ↗
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {pkg.status === 'published' ? (
            <ActionButton action={setPackageStatus} fields={{ id: pkg.id, status: 'draft' }}>
              Despublicar
            </ActionButton>
          ) : (
            <ActionButton
              action={setPackageStatus}
              fields={{ id: pkg.id, status: 'published' }}
              variant="primary"
            >
              Publicar
            </ActionButton>
          )}
        </div>
      </div>

      <div className="mt-8">
        <PackageForm pkg={pkg} />
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Temario</h2>
        <p className="mt-1 text-sm text-mist-400">
          El orden de módulos y lecciones es el que verá el alumno en su biblioteca.
        </p>

        <div className="mt-6">
          <CurriculumEditor packageId={pkg.id} modules={modules ?? []} lessons={lessons ?? []} />
        </div>
      </section>

      <section className="card-surface mt-12 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Índice del asistente</h2>
        <p className="mt-1 text-sm text-mist-400">
          El asistente responde con las descripciones y transcripciones de las lecciones.
          Reconstruye el índice después de editar contenido: no se actualiza solo, porque reindexar
          reescribe todos los fragmentos del paquete.
        </p>
        <div className="mt-4">
          <ActionButton action={reindexPackage} fields={{ id: pkg.id }} pendingLabel="Indexando…">
            Reconstruir índice
          </ActionButton>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="font-semibold text-red-300">Zona peligrosa</h2>
        <p className="mt-1 text-sm text-mist-400">
          Borrar elimina el paquete y todo su temario. Solo es posible si nunca se ha vendido; en
          caso contrario, archívalo para conservar el historial de facturación.
        </p>
        <div className="mt-4">
          <ActionButton
            action={deletePackage}
            fields={{ id: pkg.id }}
            confirm={`¿Borrar "${pkg.title}" y todas sus lecciones? Esta acción no se puede deshacer.`}
            variant="ghost"
          >
            Borrar paquete
          </ActionButton>
        </div>
      </section>
    </div>
  );
}
