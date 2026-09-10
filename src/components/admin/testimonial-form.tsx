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
import { createTestimonial, updateTestimonial } from '@/lib/admin/actions/testimonials';
import { IDLE_FORM_STATE } from '@/lib/admin/form';
import type { TestimonialRow } from '@/types/database.types';

export function TestimonialForm({
  testimonial,
  packages,
}: {
  testimonial?: TestimonialRow;
  packages: Array<{ id: string; title: string }>;
}) {
  const isEdit = Boolean(testimonial);
  const [state, formAction] = useActionState(
    isEdit ? updateTestimonial : createTestimonial,
    IDLE_FORM_STATE,
  );

  const suffix = testimonial?.id ?? 'new';

  return (
    <form
      action={formAction}
      className="card-surface rounded-2xl p-6"
      key={!isEdit && state.status === 'success' ? 'reset' : 'form'}
    >
      {testimonial && <input type="hidden" name="id" value={testimonial.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" htmlFor={`name-${suffix}`} error={fieldError(state, 'author_name')}>
          <Input
            id={`name-${suffix}`}
            name="author_name"
            required
            defaultValue={testimonial?.author_name}
            placeholder="María López"
          />
        </Field>

        <Field label="Rol o contexto" htmlFor={`role-${suffix}`}>
          <Input
            id={`role-${suffix}`}
            name="author_role"
            defaultValue={testimonial?.author_role ?? ''}
            placeholder="Tienda de accesorios · Colombia"
          />
        </Field>

        <Field
          label="Testimonio"
          htmlFor={`quote-${suffix}`}
          className="sm:col-span-2"
          error={fieldError(state, 'quote')}
        >
          <Textarea
            id={`quote-${suffix}`}
            name="quote"
            rows={3}
            required
            defaultValue={testimonial?.quote}
          />
        </Field>

        <Field
          label="Resultado concreto"
          htmlFor={`result-${suffix}`}
          hint="Lo que más convierte. Ej: 3.400 USD en 30 días."
        >
          <Input id={`result-${suffix}`} name="result" defaultValue={testimonial?.result ?? ''} />
        </Field>

        <Field
          label="Paquete asociado"
          htmlFor={`pkg-${suffix}`}
          hint="Sin paquete = testimonio general, se muestra en la portada."
        >
          <Select
            id={`pkg-${suffix}`}
            name="package_id"
            defaultValue={testimonial?.package_id ?? ''}
          >
            <option value="">General (portada)</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.title}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Puntuación"
          htmlFor={`rating-${suffix}`}
          hint="Solo si es real: alimenta el marcado de reseñas para Google."
          error={fieldError(state, 'rating')}
        >
          <Select
            id={`rating-${suffix}`}
            name="rating"
            defaultValue={testimonial?.rating ? String(testimonial.rating) : ''}
          >
            <option value="">Sin puntuación</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} de 5
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Enlace que lo respalda"
          htmlFor={`source-${suffix}`}
          hint="Publicación, vídeo o caso público. Opcional pero recomendable."
          error={fieldError(state, 'source_url')}
        >
          <Input
            id={`source-${suffix}`}
            name="source_url"
            defaultValue={testimonial?.source_url ?? ''}
          />
        </Field>

        <Field
          label="Avatar (URL)"
          htmlFor={`avatar-${suffix}`}
          error={fieldError(state, 'author_avatar_url')}
        >
          <Input
            id={`avatar-${suffix}`}
            name="author_avatar_url"
            defaultValue={testimonial?.author_avatar_url ?? ''}
          />
        </Field>

        <Field label="Estado" htmlFor={`status-${suffix}`}>
          <Select
            id={`status-${suffix}`}
            name="status"
            defaultValue={testimonial?.status ?? 'draft'}
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </Select>
        </Field>

        <Field label="Orden" htmlFor={`sort-${suffix}`}>
          <Input
            id={`sort-${suffix}`}
            name="sort_order"
            type="number"
            min="0"
            defaultValue={testimonial?.sort_order ?? 0}
          />
        </Field>
      </div>

      <div className="mt-5">
        <FormFeedback state={state} />
      </div>

      <div className="mt-5">
        <SubmitButton>{isEdit ? 'Guardar testimonio' : 'Crear testimonio'}</SubmitButton>
      </div>
    </form>
  );
}
