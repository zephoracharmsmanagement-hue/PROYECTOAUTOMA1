'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/guard';
import { getStripe } from '@/lib/stripe/client';
import {
  formError,
  formSuccess,
  fromZodError,
  optionalText,
  type FormState,
} from '@/lib/admin/form';
import { logger } from '@/lib/logger';

const campaignSchema = z.object({
  name: z.string().min(3, 'El nombre es obligatorio').max(120),
  headline: z.string().min(5, 'El titular es obligatorio').max(200),
  subheadline: z.string().max(300).nullable(),
  code_label: z.string().max(60).nullable(),
  stripe_promotion_code_id: z
    .string()
    .regex(/^promo_[A-Za-z0-9]+$/, 'Debe empezar por promo_')
    .nullable(),
  cta_label: z.string().max(60).nullable(),
  cta_href: z.string().max(300).nullable(),
  starts_at: z.string().datetime({ offset: true }).nullable(),
  ends_at: z.string().datetime({ offset: true }).nullable(),
  is_active: z.boolean(),
});

/** `datetime-local` no lleva zona horaria; se interpreta en la del navegador. */
function toIso(value: FormDataEntryValue | null): string | null {
  const text = optionalText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function readForm(formData: FormData) {
  return campaignSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    headline: String(formData.get('headline') ?? '').trim(),
    subheadline: optionalText(formData.get('subheadline')),
    code_label: optionalText(formData.get('code_label')),
    stripe_promotion_code_id: optionalText(formData.get('stripe_promotion_code_id')),
    cta_label: optionalText(formData.get('cta_label')),
    cta_href: optionalText(formData.get('cta_href')),
    starts_at: toIso(formData.get('starts_at')),
    ends_at: toIso(formData.get('ends_at')),
    is_active: formData.get('is_active') === 'on',
  });
}

/**
 * Comprueba contra Stripe que el código promocional existe y sigue activo.
 *
 * Es la validación que más disgustos evita: una campaña publicada con un código
 * caducado o mal copiado rompe el checkout de todo el mundo, y solo se descubre
 * cuando alguien intenta pagar.
 */
async function validatePromotionCode(promotionCodeId: string | null): Promise<FormState | null> {
  if (!promotionCodeId) return null;

  try {
    const promotionCode = await getStripe().promotionCodes.retrieve(promotionCodeId);

    if (!promotionCode.active) {
      return formError('Ese código promocional existe en Stripe pero está desactivado.');
    }

    if (promotionCode.expires_at && promotionCode.expires_at * 1000 <= Date.now()) {
      return formError('Ese código promocional ya ha caducado en Stripe.');
    }

    return null;
  } catch (error) {
    logger.warn('No se pudo verificar el código promocional', {
      message: error instanceof Error ? error.message : 'desconocido',
    });
    return formError(
      'Stripe no reconoce ese código promocional. Comprueba el id (empieza por promo_) y que sea de la misma cuenta y modo (test/live).',
    );
  }
}

function revalidateAll() {
  revalidatePath('/admin/campanas');
  // La barra de anuncio vive en el layout raíz: afecta a todo el sitio.
  revalidatePath('/', 'layout');
}

export async function createCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const invalid = await validatePromotionCode(parsed.data.stripe_promotion_code_id);
  if (invalid) return invalid;

  const { error } = await supabase.from('campaigns').insert(parsed.data);
  if (error) return formError(`No se pudo crear la campaña: ${error.message}`);

  revalidateAll();
  return formSuccess('Campaña creada.');
}

export async function updateCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Campaña inválida.');

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const invalid = await validatePromotionCode(parsed.data.stripe_promotion_code_id);
  if (invalid) return invalid;

  const { error } = await supabase.from('campaigns').update(parsed.data).eq('id', id.data);
  if (error) return formError(`No se pudo guardar: ${error.message}`);

  revalidateAll();
  return formSuccess('Campaña guardada.');
}

export async function deleteCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Campaña inválida.');

  const { error } = await supabase.from('campaigns').delete().eq('id', id.data);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidateAll();
  return formSuccess('Campaña eliminada.');
}
