'use client';

import { useActionState } from 'react';
import {
  Checkbox,
  Field,
  FormFeedback,
  Input,
  SubmitButton,
  Textarea,
  fieldError,
} from '@/components/admin/controls';
import { saveExperiment } from '@/lib/admin/actions/experiments';
import { IDLE_FORM_STATE } from '@/lib/admin/form';
import type { ExperimentRow } from '@/types/database.types';

const EXAMPLE = `[
  {
    "id": "control",
    "label": "Titular actual",
    "weight": 50,
    "payload": {
      "headline": "Sistemas listos para copiar que hacen vender a tu ecommerce",
      "subheadline": "Nada de cursos infinitos...",
      "cta": "Ver los paquetes"
    }
  },
  {
    "id": "variante-b",
    "label": "Enfoque en tiempo",
    "weight": 50,
    "payload": {
      "headline": "Monta tu sistema de ventas este fin de semana",
      "subheadline": "Implementaciones grabadas paso a paso...",
      "cta": "Empezar ahora"
    }
  }
]`;

export function ExperimentForm({ experiment }: { experiment?: ExperimentRow }) {
  const isEdit = Boolean(experiment);
  const [state, formAction] = useActionState(saveExperiment, IDLE_FORM_STATE);

  const suffix = experiment?.id ?? 'new';

  return (
    <form
      action={formAction}
      className="card-surface rounded-2xl p-6"
      key={!isEdit && state.status === 'success' ? 'reset' : 'form'}
    >
      {experiment && <input type="hidden" name="id" value={experiment.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Clave"
          htmlFor={`key-${suffix}`}
          hint="La usa el código para pedir el experimento. La portada lee landing_hero."
          error={fieldError(state, 'key')}
        >
          <Input
            id={`key-${suffix}`}
            name="key"
            required
            defaultValue={experiment?.key}
            placeholder="landing_hero"
          />
        </Field>

        <Field label="Nombre" htmlFor={`name-${suffix}`} error={fieldError(state, 'name')}>
          <Input id={`name-${suffix}`} name="name" required defaultValue={experiment?.name} />
        </Field>

        <Field
          label="Hipótesis"
          htmlFor={`hyp-${suffix}`}
          className="sm:col-span-2"
          hint="Escríbela antes de lanzar: es lo que impide reinterpretar el resultado a posteriori."
        >
          <Textarea
            id={`hyp-${suffix}`}
            name="hypothesis"
            rows={2}
            defaultValue={experiment?.hypothesis ?? ''}
            placeholder="Un titular centrado en el tiempo de implementación convierte más que uno centrado en el resultado."
          />
        </Field>

        <Field
          label="Variantes (JSON)"
          htmlFor={`variants-${suffix}`}
          className="sm:col-span-2"
          hint="Mínimo dos. Los pesos se reparten proporcionalmente; el payload es libre."
          error={fieldError(state, 'variants')}
        >
          <Textarea
            id={`variants-${suffix}`}
            name="variants"
            rows={14}
            required
            className="font-mono text-xs"
            defaultValue={experiment ? JSON.stringify(experiment.variants, null, 2) : EXAMPLE}
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            name="is_active"
            label="Experimento activo"
            hint="Pausado, todo el mundo ve el contenido por defecto del código."
            defaultChecked={experiment?.is_active ?? false}
          />
        </div>
      </div>

      <div className="mt-5">
        <FormFeedback state={state} />
      </div>

      <div className="mt-5">
        <SubmitButton>{isEdit ? 'Guardar experimento' : 'Crear experimento'}</SubmitButton>
      </div>
    </form>
  );
}
