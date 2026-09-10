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

const planSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  name: z.string().min(3, 'El nombre es obligatorio').max(120),
  description: z.string().max(600).nullable(),
  interval: z.enum(['month', 'year']),
  price_cents: z.number().int().min(0, 'Importe inválido'),
  currency: z.string().length(3).toLowerCase(),
  stripe_price_id: z.string().regex(/^price_[A-Za-z0-9]+$/, 'Debe empezar por price_'),
  trial_days: z.number().int().min(0).max(365),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
});

/** Los beneficios se editan uno por línea. */
function parseFeatures(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string') return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function readForm(formData: FormData) {
  return planSchema.safeParse({
    slug: String(formData.get('slug') ?? '')
      .trim()
      .toLowerCase(),
    name: String(formData.get('name') ?? '').trim(),
    description: optionalText(formData.get('description')),
    interval: String(formData.get('interval') ?? 'month'),
    price_cents: toCents(formData.get('price')) ?? -1,
    currency: String(formData.get('currency') ?? 'usd').trim(),
    stripe_price_id: String(formData.get('stripe_price_id') ?? '').trim(),
    trial_days: Number(formData.get('trial_days') ?? 0),
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') ?? 0),
  });
}

export async function createPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await supabase
    .from('plans')
    .insert({ ...parsed.data, features: parseFeatures(formData.get('features')) });

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return formError('Ya existe un plan con ese slug o ese price id de Stripe.');
    }
    return formError(`No se pudo crear el plan: ${error.message}`);
  }

  revalidatePath('/admin/planes');
  revalidatePath('/precios');
  return formSuccess('Plan creado.');
}

export async function updatePlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Plan inválido.');

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await supabase
    .from('plans')
    .update({ ...parsed.data, features: parseFeatures(formData.get('features')) })
    .eq('id', id.data);

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return formError('Ya existe otro plan con ese slug o ese price id de Stripe.');
    }
    return formError(`No se pudo guardar: ${error.message}`);
  }

  revalidatePath('/admin/planes');
  revalidatePath('/precios');
  return formSuccess('Plan guardado.');
}

/**
 * Los planes no se borran: desactivarlos los retira de la página de precios sin
 * romper el enlace `subscriptions.plan_id` de quien ya está suscrito a él.
 */
export async function togglePlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = z
    .object({ id: z.string().uuid(), is_active: z.enum(['true', 'false']) })
    .safeParse({ id: formData.get('id'), is_active: formData.get('is_active') });

  if (!parsed.success) return formError('Petición inválida.');

  const isActive = parsed.data.is_active === 'true';

  const { error } = await supabase
    .from('plans')
    .update({ is_active: isActive })
    .eq('id', parsed.data.id);

  if (error) return formError(`No se pudo cambiar el estado: ${error.message}`);

  revalidatePath('/admin/planes');
  revalidatePath('/precios');
  return formSuccess(isActive ? 'Plan activado.' : 'Plan desactivado.');
}
