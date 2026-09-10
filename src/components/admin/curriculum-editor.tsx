'use client';

import { useActionState } from 'react';
import { ActionButton } from '@/components/admin/action-button';
import {
  Checkbox,
  Field,
  FormFeedback,
  Input,
  Select,
  SubmitButton,
  Textarea,
  fieldError,
} from '@/components/admin/controls';
import { createModule, deleteModule, moveModule, updateModule } from '@/lib/admin/actions/modules';
import { createLesson, deleteLesson, moveLesson, updateLesson } from '@/lib/admin/actions/lessons';
import { IDLE_FORM_STATE } from '@/lib/admin/form';
import { formatDuration } from '@/lib/utils';
import type { LessonRow, ModuleRow } from '@/types/database.types';

/** Segundos → "1:22:00" / "22:00", el formato que acepta la acción. */
function toClock(seconds: number): string {
  if (seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function resourcesToText(resources: LessonRow['resources']): string {
  return resources.map((resource) => `${resource.label} | ${resource.url}`).join('\n');
}

// -----------------------------------------------------------------------------
// LECCIÓN
// -----------------------------------------------------------------------------

function LessonFields({ lesson }: { lesson?: LessonRow }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" htmlFor={`title-${lesson?.id ?? 'new'}`}>
          <Input
            id={`title-${lesson?.id ?? 'new'}`}
            name="title"
            required
            defaultValue={lesson?.title}
          />
        </Field>

        <Field label="Slug" htmlFor={`slug-${lesson?.id ?? 'new'}`}>
          <Input
            id={`slug-${lesson?.id ?? 'new'}`}
            name="slug"
            required
            defaultValue={lesson?.slug}
            placeholder="vision-general"
          />
        </Field>

        <Field label="Proveedor de video" htmlFor={`provider-${lesson?.id ?? 'new'}`}>
          <Select
            id={`provider-${lesson?.id ?? 'new'}`}
            name="provider"
            defaultValue={lesson?.provider ?? 'bunny'}
          >
            <option value="bunny">Bunny Stream</option>
            <option value="youtube">YouTube (no listado)</option>
            <option value="mux">Mux (no implementado)</option>
            <option value="none">Sin video todavía</option>
          </Select>
        </Field>

        <Field
          label="ID del video"
          htmlFor={`asset-${lesson?.id ?? 'new'}`}
          hint="GUID de Bunny o ID de YouTube."
        >
          <Input
            id={`asset-${lesson?.id ?? 'new'}`}
            name="video_asset_id"
            defaultValue={lesson?.video_asset_id ?? ''}
          />
        </Field>

        <Field
          label="Duración"
          htmlFor={`duration-${lesson?.id ?? 'new'}`}
          hint="Formato mm:ss o h:mm:ss."
        >
          <Input
            id={`duration-${lesson?.id ?? 'new'}`}
            name="duration"
            defaultValue={lesson ? toClock(lesson.duration_seconds) : ''}
            placeholder="22:00"
          />
        </Field>

        <Checkbox
          name="is_preview"
          label="Lección gratuita"
          hint="Reproducible sin cuenta. Es el gancho de conversión de la ficha de venta."
          defaultChecked={lesson?.is_preview ?? false}
        />
      </div>

      <Field label="Descripción" htmlFor={`desc-${lesson?.id ?? 'new'}`} className="mt-4">
        <Textarea
          id={`desc-${lesson?.id ?? 'new'}`}
          name="description"
          rows={2}
          defaultValue={lesson?.description ?? ''}
        />
      </Field>

      <Field
        label="Recursos descargables"
        htmlFor={`res-${lesson?.id ?? 'new'}`}
        className="mt-4"
        hint="Una línea por recurso: Etiqueta | https://url"
      >
        <Textarea
          id={`res-${lesson?.id ?? 'new'}`}
          name="resources"
          rows={2}
          defaultValue={lesson ? resourcesToText(lesson.resources) : ''}
        />
      </Field>
    </>
  );
}

function LessonEditor({
  lesson,
  packageId,
  moduleId,
}: {
  lesson: LessonRow;
  packageId: string;
  moduleId: string;
}) {
  const [state, formAction] = useActionState(updateLesson, IDLE_FORM_STATE);

  return (
    <details className="border-t border-ink-800">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm marker:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{lesson.title}</span>
          {lesson.is_preview && <span className="text-xs text-brand-400">gratis</span>}
          {!lesson.video_asset_id && (
            <span className="text-xs text-amber-400" title="Sin video asignado">
              sin video
            </span>
          )}
        </span>
        <span className="shrink-0 text-xs text-mist-400">
          {formatDuration(lesson.duration_seconds)}
        </span>
      </summary>

      <div className="pb-5">
        <form action={formAction} className="rounded-xl border border-ink-700 bg-ink-950 p-4">
          <input type="hidden" name="id" value={lesson.id} />
          <input type="hidden" name="module_id" value={moduleId} />
          <input type="hidden" name="package_id" value={packageId} />

          <FormFeedback state={state} />
          {fieldError(state, 'slug') && (
            <p className="mt-2 text-xs text-red-400">Slug: {fieldError(state, 'slug')}</p>
          )}

          <div className="mt-4">
            <LessonFields lesson={lesson} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <SubmitButton size="sm">Guardar lección</SubmitButton>
          </div>
        </form>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ActionButton
            action={moveLesson}
            fields={{
              id: lesson.id,
              module_id: moduleId,
              package_id: packageId,
              direction: 'up',
            }}
            title="Subir"
          >
            ↑
          </ActionButton>
          <ActionButton
            action={moveLesson}
            fields={{
              id: lesson.id,
              module_id: moduleId,
              package_id: packageId,
              direction: 'down',
            }}
            title="Bajar"
          >
            ↓
          </ActionButton>
          <ActionButton
            action={deleteLesson}
            fields={{ id: lesson.id, package_id: packageId }}
            confirm={`¿Eliminar la lección "${lesson.title}"? Esta acción no se puede deshacer.`}
            variant="ghost"
          >
            Eliminar lección
          </ActionButton>
        </div>
      </div>
    </details>
  );
}

function NewLessonForm({ packageId, moduleId }: { packageId: string; moduleId: string }) {
  const [state, formAction] = useActionState(createLesson, IDLE_FORM_STATE);

  return (
    <details className="border-t border-ink-800">
      <summary className="cursor-pointer list-none py-3 text-sm font-medium text-brand-400 marker:hidden">
        + Añadir lección
      </summary>

      <form
        action={formAction}
        className="mb-5 rounded-xl border border-ink-700 bg-ink-950 p-4"
        key={state.status === 'success' ? 'reset' : 'form'}
      >
        <input type="hidden" name="module_id" value={moduleId} />
        <input type="hidden" name="package_id" value={packageId} />

        <FormFeedback state={state} />

        <div className="mt-4">
          <LessonFields />
        </div>

        <div className="mt-5">
          <SubmitButton size="sm" pendingLabel="Creando…">
            Crear lección
          </SubmitButton>
        </div>
      </form>
    </details>
  );
}

// -----------------------------------------------------------------------------
// MÓDULO
// -----------------------------------------------------------------------------

function ModuleEditor({
  module,
  lessons,
  packageId,
}: {
  module: ModuleRow;
  lessons: LessonRow[];
  packageId: string;
}) {
  const [state, formAction] = useActionState(updateModule, IDLE_FORM_STATE);

  return (
    <div className="card-surface rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">{module.title}</h3>
          <p className="mt-1 text-xs text-mist-400">
            {lessons.length} lección(es) ·{' '}
            {formatDuration(lessons.reduce((total, lesson) => total + lesson.duration_seconds, 0))}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            action={moveModule}
            fields={{ id: module.id, package_id: packageId, direction: 'up' }}
            title="Subir módulo"
          >
            ↑
          </ActionButton>
          <ActionButton
            action={moveModule}
            fields={{ id: module.id, package_id: packageId, direction: 'down' }}
            title="Bajar módulo"
          >
            ↓
          </ActionButton>
          <ActionButton
            action={deleteModule}
            fields={{ id: module.id, package_id: packageId }}
            confirm={`¿Eliminar el módulo "${module.title}"? Se borrarán también sus ${lessons.length} lección(es).`}
            variant="ghost"
          >
            Eliminar
          </ActionButton>
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer list-none text-sm text-mist-400 marker:hidden hover:text-mist-50">
          Editar título y resumen
        </summary>

        <form action={formAction} className="mt-3 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={module.id} />
          <input type="hidden" name="package_id" value={packageId} />

          <Field label="Título" htmlFor={`mtitle-${module.id}`}>
            <Input id={`mtitle-${module.id}`} name="title" required defaultValue={module.title} />
          </Field>

          <Field label="Resumen" htmlFor={`msum-${module.id}`}>
            <Input id={`msum-${module.id}`} name="summary" defaultValue={module.summary ?? ''} />
          </Field>

          <div className="sm:col-span-2">
            <FormFeedback state={state} />
          </div>

          <div className="sm:col-span-2">
            <SubmitButton size="sm">Guardar módulo</SubmitButton>
          </div>
        </form>
      </details>

      <div className="mt-4">
        {lessons.map((lesson) => (
          <LessonEditor
            key={lesson.id}
            lesson={lesson}
            packageId={packageId}
            moduleId={module.id}
          />
        ))}
        <NewLessonForm packageId={packageId} moduleId={module.id} />
      </div>
    </div>
  );
}

function NewModuleForm({ packageId }: { packageId: string }) {
  const [state, formAction] = useActionState(createModule, IDLE_FORM_STATE);

  return (
    <form
      action={formAction}
      className="card-surface rounded-2xl p-6"
      key={state.status === 'success' ? 'reset' : 'form'}
    >
      <h3 className="text-lg font-semibold">Añadir módulo</h3>

      <input type="hidden" name="package_id" value={packageId} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Título" htmlFor="new-module-title" error={fieldError(state, 'title')}>
          <Input
            id="new-module-title"
            name="title"
            required
            placeholder="Fundamentos y preparación"
          />
        </Field>

        <Field label="Resumen" htmlFor="new-module-summary">
          <Input
            id="new-module-summary"
            name="summary"
            placeholder="Qué necesitas antes de empezar."
          />
        </Field>
      </div>

      <div className="mt-4">
        <FormFeedback state={state} />
      </div>

      <div className="mt-4">
        <SubmitButton pendingLabel="Creando…">Crear módulo</SubmitButton>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------

export function CurriculumEditor({
  packageId,
  modules,
  lessons,
}: {
  packageId: string;
  modules: ModuleRow[];
  lessons: LessonRow[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {modules.map((module) => (
        <ModuleEditor
          key={module.id}
          module={module}
          lessons={lessons.filter((lesson) => lesson.module_id === module.id)}
          packageId={packageId}
        />
      ))}

      {modules.length === 0 && (
        <p className="rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          Este paquete aún no tiene módulos. Crea el primero abajo.
        </p>
      )}

      <NewModuleForm packageId={packageId} />
    </div>
  );
}
