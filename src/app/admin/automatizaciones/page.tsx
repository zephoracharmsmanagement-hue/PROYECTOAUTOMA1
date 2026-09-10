import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { AutomationForm } from '@/components/admin/automation-form';
import { Badge } from '@/components/ui/badge';
import { deleteAutomation } from '@/lib/admin/actions/automations';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = { title: 'Automatizaciones' };

export default async function AdminAutomationsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: automations }, { data: packages }, { data: lessons }] = await Promise.all([
    supabase.from('automations').select('*').order('sort_order'),
    supabase.from('packages').select('id, title').order('sort_order'),
    supabase
      .from('lessons')
      .select('id, title, modules!inner(package_id)')
      .order('sort_order')
      .limit(300),
  ]);

  const packageList = packages ?? [];
  const lessonList = (lessons ?? []).map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    packageId: (lesson.modules as unknown as { package_id: string }).package_id,
  }));

  const list = automations ?? [];

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold">Automatizaciones instalables</h2>
      <p className="mt-1 text-sm text-mist-400">
        Flujos de n8n o Make que el alumno importa en su propia cuenta. El JSON es contenido de
        pago: solo lo descarga quien tiene acceso al paquete.
      </p>

      <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        <strong>Exporta siempre sin credenciales.</strong> Un flujo con claves dentro se repartiría
        tal cual a todos los alumnos. El formulario rechaza el guardado si detecta patrones de clave
        conocidos, pero esa comprobación es una red de seguridad, no una garantía: revísalo tú.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {list.map((automation) => (
          <div key={automation.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge
                className={
                  automation.status === 'published' ? 'border-brand-600 text-brand-400' : undefined
                }
              >
                {automation.status}
              </Badge>
              <Badge>{automation.platform}</Badge>
              <span className="text-mist-400">{automation.name}</span>
              <ActionButton
                action={deleteAutomation}
                fields={{ id: automation.id }}
                confirm={`¿Eliminar "${automation.name}"?`}
                variant="ghost"
              >
                Eliminar
              </ActionButton>
            </div>
            <AutomationForm
              automation={automation}
              packages={packageList}
              lessons={lessonList.filter((lesson) => lesson.packageId === automation.package_id)}
            />
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          Todavía no hay automatizaciones.
        </p>
      )}

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Añadir automatización</h3>
        <div className="mt-4">
          <AutomationForm packages={packageList} lessons={lessonList} />
        </div>
      </div>
    </div>
  );
}
