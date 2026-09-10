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
import { createOffer, updateOffer } from '@/lib/admin/actions/offers';
import { IDLE_FORM_STATE, fromCents } from '@/lib/admin/form';
import type { OfferRow } from '@/types/database.types';

export function OfferForm({
  offer,
  packages,
}: {
  offer?: OfferRow;
  packages: Array<{ id: string; title: string }>;
}) {
  const isEdit = Boolean(offer);
  const [state, formAction] = useActionState(isEdit ? updateOffer : createOffer, IDLE_FORM_STATE);

  const suffix = offer?.id ?? 'new';

  return (
    <form
      action={formAction}
      className="card-surface rounded-2xl p-6"
      key={!isEdit && state.status === 'success' ? 'reset' : 'form'}
    >
      {offer && <input type="hidden" name="id" value={offer.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Se muestra al comprar"
          htmlFor={`source-${suffix}`}
          hint="El paquete cuyo checkout o página de éxito enseña la oferta."
          error={fieldError(state, 'source_package_id')}
        >
          <Select
            id={`source-${suffix}`}
            name="source_package_id"
            required
            defaultValue={offer?.source_package_id ?? ''}
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
          label="Paquete que se ofrece"
          htmlFor={`offered-${suffix}`}
          error={fieldError(state, 'offer_package_id')}
        >
          <Select
            id={`offered-${suffix}`}
            name="offer_package_id"
            required
            defaultValue={offer?.offer_package_id ?? ''}
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
          label="Ubicación"
          htmlFor={`placement-${suffix}`}
          hint="Bump: casilla en la ficha, antes de pagar. Upsell: oferta tras la compra."
        >
          <Select
            id={`placement-${suffix}`}
            name="placement"
            defaultValue={offer?.placement ?? 'bump'}
          >
            <option value="bump">Order bump (antes de pagar)</option>
            <option value="upsell">Upsell (después de comprar)</option>
          </Select>
        </Field>

        <Field label="Orden" htmlFor={`sort-${suffix}`}>
          <Input
            id={`sort-${suffix}`}
            name="sort_order"
            type="number"
            min="0"
            defaultValue={offer?.sort_order ?? 0}
          />
        </Field>

        <Field
          label="Titular de la oferta"
          htmlFor={`headline-${suffix}`}
          className="sm:col-span-2"
          error={fieldError(state, 'headline')}
        >
          <Input
            id={`headline-${suffix}`}
            name="headline"
            required
            defaultValue={offer?.headline}
            placeholder="Añade el paquete de WhatsApp por solo 49 USD más"
          />
        </Field>

        <Field label="Descripción" htmlFor={`desc-${suffix}`} className="sm:col-span-2">
          <Textarea
            id={`desc-${suffix}`}
            name="description"
            rows={2}
            defaultValue={offer?.description ?? ''}
          />
        </Field>

        <Field
          label="Precio especial"
          htmlFor={`price-${suffix}`}
          hint="Vacío = se cobra el precio normal del paquete ofrecido."
          error={fieldError(state, 'price_cents')}
        >
          <Input
            id={`price-${suffix}`}
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={fromCents(offer?.price_cents)}
          />
        </Field>

        <Field
          label="Stripe price id de la oferta"
          htmlFor={`stripe-${suffix}`}
          hint="Obligatorio si pones precio especial: es lo que se cobra de verdad."
          error={fieldError(state, 'stripe_price_id')}
        >
          <Input
            id={`stripe-${suffix}`}
            name="stripe_price_id"
            defaultValue={offer?.stripe_price_id ?? ''}
            placeholder="price_1AbC..."
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            name="is_active"
            label="Oferta activa"
            defaultChecked={offer?.is_active ?? true}
          />
        </div>
      </div>

      <div className="mt-5">
        <FormFeedback state={state} />
      </div>

      <div className="mt-5">
        <SubmitButton>{isEdit ? 'Guardar oferta' : 'Crear oferta'}</SubmitButton>
      </div>
    </form>
  );
}
