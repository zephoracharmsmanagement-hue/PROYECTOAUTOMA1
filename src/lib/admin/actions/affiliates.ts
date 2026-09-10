'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/guard';
import {
  formError,
  formSuccess,
  fromZodError,
  optionalText,
  type FormState,
} from '@/lib/admin/form';
import { logger } from '@/lib/logger';

const affiliateSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  commission_pct: z.number().min(0).max(100),
  is_active: z.boolean(),
  payout_details: z.string().max(600).nullable(),
  notes: z.string().max(600).nullable(),
});

export async function saveAffiliate(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = affiliateSchema.safeParse({
    email: String(formData.get('email') ?? '')
      .trim()
      .toLowerCase(),
    code: String(formData.get('code') ?? '').trim(),
    commission_pct: Number(formData.get('commission_pct') ?? 30),
    is_active: formData.get('is_active') === 'on',
    payout_details: optionalText(formData.get('payout_details')),
    notes: optionalText(formData.get('notes')),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const id = optionalText(formData.get('id'));

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', parsed.data.email)
    .maybeSingle();

  if (!profile) {
    return formError(
      'No existe ninguna cuenta con ese email. El afiliado debe registrarse antes de darlo de alta.',
    );
  }

  const payload = {
    user_id: profile.id,
    code: parsed.data.code,
    commission_pct: parsed.data.commission_pct,
    is_active: parsed.data.is_active,
    payout_details: parsed.data.payout_details,
    notes: parsed.data.notes,
  };

  const { error } = id
    ? await supabase.from('affiliates').update(payload).eq('id', id)
    : await supabase.from('affiliates').insert(payload);

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return formError('Ese código ya está en uso, o esa persona ya es afiliada.');
    }
    return formError(`No se pudo guardar: ${error.message}`);
  }

  revalidatePath('/admin/afiliados');
  return formSuccess(id ? 'Afiliado guardado.' : 'Afiliado dado de alta.');
}

/**
 * Cambia el estado de una comisión.
 *
 * El ciclo es pending → approved → paid, con `void` para anular (reembolso,
 * fraude). Aprobar y pagar son decisiones humanas a propósito: mientras corre el
 * periodo de garantía, una venta todavía puede devolverse.
 */
export async function setReferralStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();

  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(['pending', 'approved', 'paid', 'void']),
    })
    .safeParse({ id: formData.get('id'), status: formData.get('status') });

  if (!parsed.success) return formError('Petición inválida.');

  const { error } = await supabase
    .from('referrals')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id);

  if (error) return formError(`No se pudo actualizar: ${error.message}`);

  logger.info('Estado de comisión actualizado', {
    by: user.id,
    referralId: parsed.data.id,
    status: parsed.data.status,
  });

  revalidatePath('/admin/afiliados');
  return formSuccess('Comisión actualizada.');
}

/** Aprueba de una vez todas las comisiones pendientes de un afiliado. */
export async function approvePendingCommissions(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('affiliate_id'));
  if (!id.success) return formError('Afiliado inválido.');

  const { error, count } = await supabase
    .from('referrals')
    .update({ status: 'approved' }, { count: 'exact' })
    .eq('affiliate_id', id.data)
    .eq('status', 'pending');

  if (error) return formError(`No se pudo aprobar: ${error.message}`);

  revalidatePath('/admin/afiliados');
  return formSuccess(`${count ?? 0} comisión(es) aprobadas.`);
}
