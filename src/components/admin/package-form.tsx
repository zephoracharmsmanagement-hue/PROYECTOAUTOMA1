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
import { createPackage, updatePackage } from '@/lib/admin/actions/packages';
import { IDLE_FORM_STATE, fromCents } from '@/lib/admin/form';
import type { PackageRow } from '@/types/database.types';

/** Serializa los bullets al formato "Título | Detalle" que espera la acción. */
function featuresToText(features: PackageRow['features']): string {
  return features.map((feature) => `${feature.title} | ${feature.detail}`).join('\n');
}

export function PackageForm({ pkg }: { pkg?: PackageRow }) {
  const isEdit = Boolean(pkg);
  const [state, formAction] = useActionState(
    isEdit ? updatePackage : createPackage,
    IDLE_FORM_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {pkg && <input type="hidden" name="id" value={pkg.id} />}

      <FormFeedback state={state} />

      {/* ------------------------------------------------------- IDENTIDAD */}
      <section className="card-surface rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Identidad</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Título" htmlFor="title" error={fieldError(state, 'title')}>
            <Input
              id="title"
              name="title"
              required
              defaultValue={pkg?.title}
              placeholder="Dropshipping de Cero a Primera Venta"
            />
          </Field>

          <Field
            label="Slug (URL)"
            htmlFor="slug"
            hint="Aparece en /paquetes/… Cambiarlo rompe los enlaces ya compartidos."
            error={fieldError(state, 'slug')}
          >
            <Input
              id="slug"
              name="slug"
              required
              defaultValue={pkg?.slug}
              placeholder="dropshipping-cero-a-venta"
            />
          </Field>

          <Field label="Subtítulo" htmlFor="subtitle" error={fieldError(state, 'subtitle')}>
            <Input
              id="subtitle"
              name="subtitle"
              defaultValue={pkg?.subtitle ?? ''}
              placeholder="Tu primera tienda validada en 14 días"
            />
          </Field>

          <Field
            label="Promesa comercial"
            htmlFor="outcome"
            hint="Una frase con el resultado concreto. Es lo que se lee en la card del catálogo."
            error={fieldError(state, 'outcome')}
          >
            <Input
              id="outcome"
              name="outcome"
              defaultValue={pkg?.outcome ?? ''}
              placeholder="Lanza una tienda validada y con su primera venta real."
            />
          </Field>

          <Field label="Categoría" htmlFor="category" error={fieldError(state, 'category')}>
            <Select id="category" name="category" defaultValue={pkg?.category ?? 'ecommerce'}>
              <option value="ecommerce">ecommerce</option>
              <option value="dropshipping">dropshipping</option>
              <option value="automatizacion">automatización</option>
              <option value="ia">IA</option>
              <option value="ads">ads</option>
            </Select>
          </Field>

          <Field label="Nivel" htmlFor="level" error={fieldError(state, 'level')}>
            <Select id="level" name="level" defaultValue={pkg?.level ?? 'intermedio'}>
              <option value="principiante">principiante</option>
              <option value="intermedio">intermedio</option>
              <option value="avanzado">avanzado</option>
            </Select>
          </Field>

          <Field
            label="Descripción"
            htmlFor="description"
            className="sm:col-span-2"
            error={fieldError(state, 'description')}
          >
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={pkg?.description ?? ''}
            />
          </Field>

          <Field
            label="URL de portada"
            htmlFor="cover_url"
            className="sm:col-span-2"
            hint="Debe estar en un dominio permitido en next.config.ts (*.b-cdn.net o *.supabase.co)."
            error={fieldError(state, 'cover_url')}
          >
            <Input id="cover_url" name="cover_url" defaultValue={pkg?.cover_url ?? ''} />
          </Field>
        </div>
      </section>

      {/* ---------------------------------------------------------- VALOR */}
      {isEdit && (
        <section className="card-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Bullets de valor</h2>
          <p className="mt-1 text-sm text-mist-400">
            Una línea por bullet, con el formato{' '}
            <code className="text-brand-400">Título | Detalle</code>.
          </p>

          <Field label="Bullets" htmlFor="features" className="mt-5">
            <Textarea
              id="features"
              name="features"
              rows={5}
              defaultValue={pkg ? featuresToText(pkg.features) : ''}
              placeholder={'Validación con datos | Criterios medibles de demanda y margen.'}
            />
          </Field>
        </section>
      )}

      {/* --------------------------------------------------------- PRECIO */}
      <section className="card-surface rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Precio y venta</h2>
        <p className="mt-1 text-sm text-mist-400">
          El importe se guarda en centavos. El price id de Stripe es lo que se cobra realmente: si
          no coincide con este precio, el cliente pagará lo que diga Stripe.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Field
            label="Precio de pago único"
            htmlFor="price_one_time"
            error={fieldError(state, 'price_one_time_cents')}
          >
            <Input
              id="price_one_time"
              name="price_one_time"
              type="number"
              step="0.01"
              min="0"
              defaultValue={fromCents(pkg?.price_one_time_cents)}
              placeholder="149.00"
            />
          </Field>

          <Field
            label="Precio tachado"
            htmlFor="compare_at_price"
            hint="Opcional, para anclaje de precio."
            error={fieldError(state, 'compare_at_price_cents')}
          >
            <Input
              id="compare_at_price"
              name="compare_at_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={fromCents(pkg?.compare_at_price_cents)}
              placeholder="299.00"
            />
          </Field>

          <Field label="Moneda" htmlFor="currency" error={fieldError(state, 'currency')}>
            <Select id="currency" name="currency" defaultValue={pkg?.currency ?? 'usd'}>
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="mxn">MXN</option>
              <option value="cop">COP</option>
              <option value="ars">ARS</option>
            </Select>
          </Field>

          <Field
            label="Stripe price id"
            htmlFor="stripe_price_id_one_time"
            className="sm:col-span-2"
            hint="Dashboard de Stripe → Products → el precio de pago único."
            error={fieldError(state, 'stripe_price_id_one_time')}
          >
            <Input
              id="stripe_price_id_one_time"
              name="stripe_price_id_one_time"
              defaultValue={pkg?.stripe_price_id_one_time ?? ''}
              placeholder="price_1AbC..."
            />
          </Field>

          <Field label="Orden" htmlFor="sort_order" error={fieldError(state, 'sort_order')}>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              min="0"
              defaultValue={pkg?.sort_order ?? 0}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Checkbox
            name="included_in_subscription"
            label="Incluido en la membresía All Access"
            hint="Desmárcalo para vender este paquete solo por separado."
            defaultChecked={pkg?.included_in_subscription ?? true}
          />

          <Field label="Estado" htmlFor="status" error={fieldError(state, 'status')}>
            <Select id="status" name="status" defaultValue={pkg?.status ?? 'draft'}>
              <option value="draft">Borrador (no visible)</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </Select>
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <SubmitButton size="lg">{isEdit ? 'Guardar cambios' : 'Crear paquete'}</SubmitButton>
      </div>
    </form>
  );
}
