'use client';

import { useActionState } from 'react';
import {
  Field,
  FormFeedback,
  Input,
  Select,
  SubmitButton,
  Textarea,
  fieldError,
} from '@/components/admin/controls';
import { saveAutomation } from '@/lib/admin/actions/automations';
import { IDLE_FORM_STATE } from '@/lib/admin/form';
import type { AutomationRow } from '@/types/database.types';

export function AutomationForm({
  automation,
  packages,
  lessons,
}: {
  automation?: AutomationRow;
  packages: Array<{ id: string; title: string }>;
  lessons: Array<{ id: string; title: string; packageId: string }>;
}) {
  const isEdit = Boolean(automation);
  const [state, formAction] = useActionState(saveAutomation, IDLE_FORM_STATE);

  const suffix = automation?.id ?? 'new';

  return (
    <form
      action={formAction}
      className="card-surface rounded-2xl p-6"
      key={!isEdit && state.status === 'success' ? 'reset' : 'form'}
    >
      {automation && <input type="hidden" name="id" value={automation.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" htmlFor={`name-${suffix}`} error={fieldError(state, 'name')}>
          <Input
            id={`name-${suffix}`}
            name="name"
            required
            defaultValue={automation?.name}
            placeholder="Recuperador de carritos por WhatsApp"
          />
        </Field>

        <Field label="Plataforma" htmlFor={`platform-${suffix}`}>
          <Select
            id={`platform-${suffix}`}
            name="platform"
            defaultValue={automation?.platform ?? 'n8n'}
          >
            <option value="n8n">n8n</option>
            <option value="make">Make</option>
            <option value="zapier">Zapier</option>
            <option value="other">Otra</option>
          </Select>
        </Field>

        <Field label="Paquete" htmlFor={`pkg-${suffix}`} error={fieldError(state, 'package_id')}>
          <Select
            id={`pkg-${suffix}`}
            name="package_id"
            required
            defaultValue={automation?.package_id ?? ''}
          >
            <option value="">Selecciona…</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.title}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Lección (opcional)"
          htmlFor={`lesson-${suffix}`}
          hint="Si la eliges, se muestra también dentro de esa lección."
        >
          <Select
            id={`lesson-${suffix}`}
            name="lesson_id"
            defaultValue={automation?.lesson_id ?? ''}
          >
            <option value="">Solo a nivel de paquete</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Descripción" htmlFor={`desc-${suffix}`} className="sm:col-span-2">
          <Textarea
            id={`desc-${suffix}`}
            name="description"
            rows={2}
            defaultValue={automation?.description ?? ''}
          />
        </Field>

        <Field
          label="Flujo exportado (JSON)"
          htmlFor={`workflow-${suffix}`}
          className="sm:col-span-2"
          hint="Expórtalo SIN credenciales. Se rechaza el guardado si detectamos claves dentro."
        >
          <Textarea
            id={`workflow-${suffix}`}
            name="workflow"
            rows={10}
            required
            className="font-mono text-xs"
            defaultValue={automation ? JSON.stringify(automation.workflow, null, 2) : ''}
          />
        </Field>

        <Field
          label="Credenciales que debe conectar el alumno"
          htmlFor={`requires-${suffix}`}
          hint="Separadas por comas: OpenAI, Gmail, WhatsApp"
        >
          <Input
            id={`requires-${suffix}`}
            name="requires"
            defaultValue={automation?.requires?.join(', ') ?? ''}
          />
        </Field>

        <Field label="Versión" htmlFor={`version-${suffix}`}>
          <Input
            id={`version-${suffix}`}
            name="version"
            defaultValue={automation?.version ?? '1.0.0'}
          />
        </Field>

        <Field label="Notas de instalación" htmlFor={`notes-${suffix}`} className="sm:col-span-2">
          <Textarea
            id={`notes-${suffix}`}
            name="setup_notes"
            rows={3}
            defaultValue={automation?.setup_notes ?? ''}
          />
        </Field>

        <Field label="Estado" htmlFor={`status-${suffix}`}>
          <Select
            id={`status-${suffix}`}
            name="status"
            defaultValue={automation?.status ?? 'draft'}
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicada</option>
            <option value="archived">Archivada</option>
          </Select>
        </Field>

        <Field label="Orden" htmlFor={`sort-${suffix}`}>
          <Input
            id={`sort-${suffix}`}
            name="sort_order"
            type="number"
            min="0"
            defaultValue={automation?.sort_order ?? 0}
          />
        </Field>
      </div>

      <div className="mt-5">
        <FormFeedback state={state} />
      </div>

      <div className="mt-5">
        <SubmitButton>{isEdit ? 'Guardar automatización' : 'Crear automatización'}</SubmitButton>
      </div>
    </form>
  );
}
