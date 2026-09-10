import { Badge } from '@/components/ui/badge';
import type { AutomationPlatform } from '@/types/database.types';

export interface AutomationItem {
  id: string;
  name: string;
  description: string | null;
  platform: AutomationPlatform;
  version: string;
  setup_notes: string | null;
  requires: string[];
}

const PLATFORM_LABEL: Record<AutomationPlatform, string> = {
  n8n: 'n8n',
  make: 'Make',
  zapier: 'Zapier',
  other: 'Otra',
};

const IMPORT_HINT: Record<AutomationPlatform, string> = {
  n8n: 'En n8n: Workflows → Import from File.',
  make: 'En Make: Scenarios → Import Blueprint.',
  zapier: 'En Zapier: importa la plantilla desde el JSON.',
  other: 'Importa el archivo en tu herramienta.',
};

/**
 * Automatizaciones descargables de un paquete o lección.
 *
 * El enlace apunta a un endpoint protegido: el JSON del flujo es contenido de
 * pago, igual que el video.
 */
export function AutomationList({
  automations,
  title = 'Automatizaciones listas para importar',
}: {
  automations: AutomationItem[];
  title?: string;
}) {
  if (automations.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>

      <div className="mt-5 flex flex-col gap-4">
        {automations.map((automation) => (
          <article key={automation.id} className="card-surface rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{automation.name}</h3>
              <Badge>{PLATFORM_LABEL[automation.platform]}</Badge>
              <Badge>v{automation.version}</Badge>
            </div>

            {automation.description && (
              <p className="mt-2 text-sm text-mist-400">{automation.description}</p>
            )}

            {automation.requires.length > 0 && (
              <p className="mt-3 text-xs text-mist-400">
                Necesitas conectar tus propias credenciales de:{' '}
                <span className="text-mist-200">{automation.requires.join(', ')}</span>
              </p>
            )}

            {automation.setup_notes && (
              <details className="mt-3">
                <summary className="cursor-pointer list-none text-xs text-brand-400 marker:hidden">
                  Notas de instalación
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-sm text-mist-400">
                  {automation.setup_notes}
                </p>
              </details>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={`/api/automations/${automation.id}/download`}
                className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-ink-950 hover:bg-brand-400"
              >
                Descargar JSON
              </a>
              <span className="text-xs text-mist-400">{IMPORT_HINT[automation.platform]}</span>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 text-xs text-mist-400">
        Los flujos vienen sin credenciales. Conecta las tuyas al importarlos: nunca compartas un
        export que incluya claves.
      </p>
    </section>
  );
}
