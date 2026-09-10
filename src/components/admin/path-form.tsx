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
import { savePath } from '@/lib/admin/actions/paths';
import { IDLE_FORM_STATE, fromCents } from '@/lib/admin/form';
import type { PathRow } from '@/types/database.types';

export function PathForm({ path, members = '' }: { path?: PathRow; members?: string }) {
  const isEdit = Boolean(path);
  const [state, formAction] = useActionState(savePath, IDLE_FORM_STATE);

  const suffix = path?.id ?? 'new';

  return (
    <form
      action={formAction}
      className="card-surface rounded-2xl p-6"
      key={!isEdit && state.status === 'success' ? 'reset' : 'form'}
    >
      {path && <input type="hidden" name="id" value={path.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Título" htmlFor={`title-${suffix}`} error={fieldError(state, 'title')}>
          <Input id={`title-${suffix}`} name="title" required defaultValue={path?.title} />
        </Field>

        <Field label="Slug" htmlFor={`slug-${suffix}`} error={fieldError(state, 'slug')}>
          <Input
            id={`slug-${suffix}`}
            name="slug"
            required
            defaultValue={path?.slug}
            placeholder="de-cero-a-tienda-automatizada"
          />
        </Field>

        <Field label="Subtítulo" htmlFor={`sub-${suffix}`}>
          <Input id={`sub-${suffix}`} name="subtitle" defaultValue={path?.subtitle ?? ''} />
        </Field>

        <Field label="Promesa" htmlFor={`outcome-${suffix}`}>
          <Input id={`outcome-${suffix}`} name="outcome" defaultValue={path?.outcome ?? ''} />
        </Field>

        <Field label="Descripción" htmlFor={`desc-${suffix}`} className="sm:col-span-2">
          <Textarea
            id={`desc-${suffix}`}
            name="description"
            rows={3}
            defaultValue={path?.description ?? ''}
          />
        </Field>

        <Field
          label="Paquetes de la ruta"
          htmlFor={`members-${suffix}`}
          className="sm:col-span-2"
          hint="Uno por línea y en orden: slug-del-paquete | por qué va aquí"
        >
          <Textarea
            id={`members-${suffix}`}
            name="members"
            rows={5}
            className="font-mono text-xs"
            defaultValue={members}
            placeholder={'dropshipping-cero-a-venta | Primero valida y monta la tienda.'}
          />
        </Field>

        <Field
          label="Precio del lote"
          htmlFor={`price-${suffix}`}
          hint="Debe salir a cuenta frente a comprar los paquetes por separado."
        >
          <Input
            id={`price-${suffix}`}
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={fromCents(path?.price_one_time_cents)}
          />
        </Field>

        <Field label="Moneda" htmlFor={`currency-${suffix}`}>
          <Select id={`currency-${suffix}`} name="currency" defaultValue={path?.currency ?? 'usd'}>
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="mxn">MXN</option>
            <option value="cop">COP</option>
            <option value="ars">ARS</option>
          </Select>
        </Field>

        <Field
          label="Stripe price id"
          htmlFor={`stripe-${suffix}`}
          className="sm:col-span-2"
          hint="Un precio de pago único creado en Stripe para el lote completo."
          error={fieldError(state, 'stripe_price_id_one_time')}
        >
          <Input
            id={`stripe-${suffix}`}
            name="stripe_price_id_one_time"
            defaultValue={path?.stripe_price_id_one_time ?? ''}
            placeholder="price_1AbC..."
          />
        </Field>

        <Field label="Estado" htmlFor={`status-${suffix}`}>
          <Select id={`status-${suffix}`} name="status" defaultValue={path?.status ?? 'draft'}>
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
            defaultValue={path?.sort_order ?? 0}
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            name="included_in_subscription"
            label="Incluida en la membresía All Access"
            defaultChecked={path?.included_in_subscription ?? true}
          />
        </div>
      </div>

      <div className="mt-5">
        <FormFeedback state={state} />
      </div>

      <div className="mt-5">
        <SubmitButton>{isEdit ? 'Guardar ruta' : 'Crear ruta'}</SubmitButton>
      </div>
    </form>
  );
}
