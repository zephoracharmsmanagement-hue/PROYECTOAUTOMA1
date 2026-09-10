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
import { createCampaign, updateCampaign } from '@/lib/admin/actions/campaigns';
import { IDLE_FORM_STATE } from '@/lib/admin/form';
import type { CampaignRow } from '@/types/database.types';

/** ISO → valor de `datetime-local` en la zona horaria del navegador. */
function toLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function CampaignForm({ campaign }: { campaign?: CampaignRow }) {
  const isEdit = Boolean(campaign);
  const [state, formAction] = useActionState(
    isEdit ? updateCampaign : createCampaign,
    IDLE_FORM_STATE,
  );

  const suffix = campaign?.id ?? 'new';

  return (
    <form
      action={formAction}
      className="card-surface rounded-2xl p-6"
      key={!isEdit && state.status === 'success' ? 'reset' : 'form'}
    >
      {campaign && <input type="hidden" name="id" value={campaign.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre interno" htmlFor={`name-${suffix}`} error={fieldError(state, 'name')}>
          <Input
            id={`name-${suffix}`}
            name="name"
            required
            defaultValue={campaign?.name}
            placeholder="Lanzamiento noviembre"
          />
        </Field>

        <Field
          label="Código visible"
          htmlFor={`code-${suffix}`}
          hint="Solo informativo para el cliente."
        >
          <Input
            id={`code-${suffix}`}
            name="code_label"
            defaultValue={campaign?.code_label ?? ''}
            placeholder="LANZAMIENTO30"
          />
        </Field>

        <Field
          label="Titular de la barra"
          htmlFor={`headline-${suffix}`}
          className="sm:col-span-2"
          error={fieldError(state, 'headline')}
        >
          <Input
            id={`headline-${suffix}`}
            name="headline"
            required
            defaultValue={campaign?.headline}
            placeholder="30% de descuento en todo el catálogo"
          />
        </Field>

        <Field label="Texto secundario" htmlFor={`sub-${suffix}`} className="sm:col-span-2">
          <Textarea
            id={`sub-${suffix}`}
            name="subheadline"
            rows={2}
            defaultValue={campaign?.subheadline ?? ''}
          />
        </Field>

        <Field
          label="Stripe promotion code id"
          htmlFor={`promo-${suffix}`}
          className="sm:col-span-2"
          hint="Si lo rellenas, el descuento se aplica solo en el checkout. Se valida contra Stripe al guardar."
          error={fieldError(state, 'stripe_promotion_code_id')}
        >
          <Input
            id={`promo-${suffix}`}
            name="stripe_promotion_code_id"
            defaultValue={campaign?.stripe_promotion_code_id ?? ''}
            placeholder="promo_1AbC..."
          />
        </Field>

        <Field label="Texto del enlace" htmlFor={`cta-${suffix}`}>
          <Input
            id={`cta-${suffix}`}
            name="cta_label"
            defaultValue={campaign?.cta_label ?? ''}
            placeholder="Ver paquetes"
          />
        </Field>

        <Field label="Destino del enlace" htmlFor={`href-${suffix}`}>
          <Input
            id={`href-${suffix}`}
            name="cta_href"
            defaultValue={campaign?.cta_href ?? ''}
            placeholder="/paquetes"
          />
        </Field>

        <Field label="Empieza" htmlFor={`start-${suffix}`} hint="Vacío = ya está en marcha.">
          <Input
            id={`start-${suffix}`}
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocalInput(campaign?.starts_at ?? null)}
          />
        </Field>

        <Field
          label="Termina"
          htmlFor={`end-${suffix}`}
          hint="Vacío = sin fin. Con fecha, la barra muestra la cuenta atrás y se apaga sola."
        >
          <Input
            id={`end-${suffix}`}
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocalInput(campaign?.ends_at ?? null)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            name="is_active"
            label="Campaña activa"
            hint="Aun activa, solo se muestra dentro de su ventana de fechas."
            defaultChecked={campaign?.is_active ?? false}
          />
        </div>
      </div>

      <div className="mt-5">
        <FormFeedback state={state} />
      </div>

      <div className="mt-5">
        <SubmitButton>{isEdit ? 'Guardar campaña' : 'Crear campaña'}</SubmitButton>
      </div>
    </form>
  );
}
