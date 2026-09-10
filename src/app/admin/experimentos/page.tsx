import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { ExperimentForm } from '@/components/admin/experiment-form';
import { Badge } from '@/components/ui/badge';
import { deleteExperiment, toggleExperiment } from '@/lib/admin/actions/experiments';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = { title: 'Experimentos' };

export default async function AdminExperimentsPage() {
  const { supabase } = await requireAdmin();

  const { data: experiments } = await supabase
    .from('experiments')
    .select('*')
    .order('created_at', { ascending: false });

  const list = experiments ?? [];

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold">Experimentos A/B</h2>
      <p className="mt-1 text-sm text-mist-400">
        El reparto es determinista por visitante: la misma persona ve siempre la misma variante. La
        variante asignada viaja en todos los eventos de analítica como{' '}
        <code className="text-brand-400">exp_&lt;clave&gt;</code>, así que puedes segmentar el
        embudo entero por variante.
      </p>

      <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        <strong>Sobre probar precios.</strong> Mostrar precios distintos a personas distintas al
        mismo tiempo obliga a informarlo (Directiva UE 2019/2161) y destruye la confianza cuando se
        descubre. Para comparar precios, cambia el precio para todo el mundo durante un periodo y
        compara con el anterior.
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {list.map((experiment) => (
          <div key={experiment.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge
                className={experiment.is_active ? 'border-brand-600 text-brand-400' : undefined}
              >
                {experiment.is_active ? 'activo' : 'pausado'}
              </Badge>
              <code className="text-xs text-mist-400">{experiment.key}</code>
              <ActionButton
                action={toggleExperiment}
                fields={{ id: experiment.id, is_active: experiment.is_active ? 'false' : 'true' }}
                variant="ghost"
              >
                {experiment.is_active ? 'Pausar' : 'Activar'}
              </ActionButton>
              <ActionButton
                action={deleteExperiment}
                fields={{ id: experiment.id }}
                confirm={`¿Eliminar el experimento "${experiment.name}"? Perderás la referencia de qué variante vio cada visitante.`}
                variant="ghost"
              >
                Eliminar
              </ActionButton>
            </div>
            <ExperimentForm experiment={experiment} />
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          Todavía no hay experimentos.
        </p>
      )}

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Crear experimento</h3>
        <div className="mt-4">
          <ExperimentForm />
        </div>
      </div>
    </div>
  );
}
