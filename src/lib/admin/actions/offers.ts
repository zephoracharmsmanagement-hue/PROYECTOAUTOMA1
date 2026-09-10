'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/guard';
import {
  formError,
  formSuccess,
  fromZodError,
  optionalText,
  toCents,
  type FormState,
} from '@/lib/admin/form';

const offerSchema = z.object({
  source_package_id: z.string().uuid('Selecciona el paquete de origen'),
  offer_package_id: z.string().uuid('Selecciona el paquete que se ofrece'),
  placement: z.enum(['bump', 'upsell']),
  headline: z.string().min(5, 'El titular es obligatorio').max(200),
  description: z.string().max(600).nullable(),
  stripe_price_id: z
    .string()
    .regex(/^price_[A-Za-z0-9]+$/, 'Debe empezar por price_')
    .nullable(),
  price_cents: z.number().int().min(0).nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
});

function readForm(formData: FormData) {
  return offerSchema.safeParse({
    source_package_id: formData.get('source_package_id'),
    offer_package_id: formData.get('offer_package_id'),
    placement: String(formData.get('placement') ?? 'bump'),
    headline: String(formData.get('headline') ?? '').trim(),
    description: optionalText(formData.get('description')),
    stripe_price_id: optionalText(formData.get('stripe_price_id')),
    price_cents: toCents(formData.get('price')),
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') ?? 0),
  });
}

/**
 * Un precio especial exige su propio price id en Stripe: el importe que se
 * muestra en la web es solo texto, lo que se cobra es el price. Dejar uno sin el
 * otro produce una oferta que anuncia un precio y cobra otro.
 */
function validatePricing(data: z.infer<typeof offerSchema>): FormState | null {
  if (data.price_cents !== null && !data.stripe_price_id) {
    return formError(
      'Has puesto un precio especial pero no su price id de Stripe. Crea ese precio en Stripe y pega su id, o deja el importe vacío para cobrar el precio normal del paquete.',
    );
  }

  if (data.stripe_price_id && data.price_cents === null) {
    return formError(
      'Has puesto un price id de Stripe pero no el importe que se mostrará. Rellena ambos para que la web y el cobro coincidan.',
    );
  }

  return null;
}

function revalidateAll() {
  revalidatePath('/admin/ofertas');
  revalidatePath('/paquetes', 'layout');
}

export async function createOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const blocked = validatePricing(parsed.data);
  if (blocked) return blocked;

  if (parsed.data.source_package_id === parsed.data.offer_package_id) {
    return formError('Un paquete no puede ofrecerse dentro de sí mismo.');
  }

  const { error } = await supabase.from('offers').insert(parsed.data);

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return formError('Ya existe esa oferta para este paquete y esta ubicación.');
    }
    return formError(`No se pudo crear la oferta: ${error.message}`);
  }

  revalidateAll();
  return formSuccess('Oferta creada.');
}

export async function updateOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Oferta inválida.');

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const blocked = validatePricing(parsed.data);
  if (blocked) return blocked;

  const { error } = await supabase.from('offers').update(parsed.data).eq('id', id.data);
  if (error) return formError(`No se pudo guardar: ${error.message}`);

  revalidateAll();
  return formSuccess('Oferta guardada.');
}

export async function deleteOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Oferta inválida.');

  const { error } = await supabase.from('offers').delete().eq('id', id.data);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidateAll();
  return formSuccess('Oferta eliminada.');
}
