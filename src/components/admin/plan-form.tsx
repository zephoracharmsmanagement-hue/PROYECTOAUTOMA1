'use client';

import { useActionState } from 'react';
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
import { createPlan, updatePlan } from '@/lib/admin/actions/plans';
import { IDLE_FORM_STATE, fromCents } from '@/lib/admin/form';
import type { PlanRow } from '@/types/database.types';

export function PlanForm({ plan }: { plan?: PlanRow }) {
  const isEdit = Boolean(plan);
  const [state, formAction] = useActionState(isEdit ? updatePlan : createPlan, IDLE_FORM_STATE);

  const suffix = plan?.id ?? 'new';

  return (
    <form
      action={formAction}
      className="card-surface rounded-2xl p-6"
      key={!isEdit && state.status === 'success' ? 'reset' : 'form'}
    >
      {plan && <input type="hidden" name="id" value={plan.id} />}

      <h3 className="text-lg font-semibold">{isEdit ? plan?.name : 'Nuevo plan'}</h3>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" htmlFor={`name-${suffix}`} error={fieldError(state, 'name')}>
          <Input id={`name-${suffix}`} name="name" required defaultValue={plan?.name} />
        </Field>

        <Field label="Slug" htmlFor={`slug-${suffix}`} error={fieldError(state, 'slug')}>
          <Input
            id={`slug-${suffix}`}
            name="slug"
            required
            defaultValue={plan?.slug}
            placeholder="all-access-mensual"
          />
        </Field>

        <Field
          label="Descripción"
          htmlFor={`desc-${suffix}`}
          className="sm:col-span-2"
          error={fieldError(state, 'description')}
        >
          <Textarea
            id={`desc-${suffix}`}
            name="description"
            rows={2}
            defaultValue={plan?.description ?? ''}
          />
        </Field>

        <Field label="Precio" htmlFor={`price-${suffix}`} error={fieldError(state, 'price_cents')}>
          <Input
            id={`price-${suffix}`}
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={fromCents(plan?.price_cents)}
          />
        </Field>

        <Field label="Moneda" htmlFor={`currency-${suffix}`} error={fieldError(state, 'currency')}>
          <Select id={`currency-${suffix}`} name="currency" defaultValue={plan?.currency ?? 'usd'}>
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="mxn">MXN</option>
            <option value="cop">COP</option>
            <option value="ars">ARS</option>
          </Select>
        </Field>

        <Field
          label="Periodicidad"
          htmlFor={`interval-${suffix}`}
          error={fieldError(state, 'interval')}
        >
          <Select
            id={`interval-${suffix}`}
            name="interval"
            defaultValue={plan?.interval ?? 'month'}
          >
            <option value="month">Mensual</option>
            <option value="year">Anual</option>
          </Select>
        </Field>

        <Field
          label="Días de prueba"
          htmlFor={`trial-${suffix}`}
          hint="0 = sin prueba gratuita."
          error={fieldError(state, 'trial_days')}
        >
          <Input
            id={`trial-${suffix}`}
            name="trial_days"
            type="number"
            min="0"
            max="365"
            defaultValue={plan?.trial_days ?? 0}
          />
        </Field>

        <Field
          label="Stripe price id"
          htmlFor={`stripe-${suffix}`}
          className="sm:col-span-2"
          hint="Debe ser un precio recurrente con la misma periodicidad seleccionada arriba."
          error={fieldError(state, 'stripe_price_id')}
        >
          <Input
            id={`stripe-${suffix}`}
            name="stripe_price_id"
            required
            defaultValue={plan?.stripe_price_id ?? ''}
            placeholder="price_1XyZ..."
          />
        </Field>

        <Field
          label="Beneficios"
          htmlFor={`features-${suffix}`}
          className="sm:col-span-2"
          hint="Uno por línea. Se muestran como lista en la página de precios."
        >
          <Textarea
            id={`features-${suffix}`}
            name="features"
            rows={4}
            defaultValue={plan?.features.join('\n') ?? ''}
          />
        </Field>

        <Field label="Orden" htmlFor={`sort-${suffix}`} error={fieldError(state, 'sort_order')}>
          <Input
            id={`sort-${suffix}`}
            name="sort_order"
            type="number"
            min="0"
            defaultValue={plan?.sort_order ?? 0}
          />
        </Field>

        <Checkbox
          name="is_active"
          label="Visible en la página de precios"
          defaultChecked={plan?.is_active ?? true}
        />
      </div>

      <div className="mt-5">
        <FormFeedback state={state} />
      </div>

      <div className="mt-5">
        <SubmitButton>{isEdit ? 'Guardar plan' : 'Crear plan'}</SubmitButton>
      </div>
    </form>
  );
}
