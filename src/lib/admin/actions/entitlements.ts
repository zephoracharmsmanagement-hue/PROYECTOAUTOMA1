'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/guard';
import { formError, formSuccess, type FormState } from '@/lib/admin/form';
import { logger } from '@/lib/logger';

/**
 * Concesión manual de acceso: soporte, regalos, afiliados o recuperación de una
 * compra cuyo webhook falló.
 *
 * Queda marcada con `source = 'manual_grant'`, de modo que en la auditoría se
 * distingue siempre de un acceso comprado.
 */
export async function grantAccess(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();

  const parsed = z
    .object({
      email: z.string().email('Email inválido'),
      target: z.string().min(1),
    })
    .safeParse({ email: formData.get('email'), target: formData.get('target') });

  if (!parsed.success) return formError('Revisa el email y el paquete seleccionado.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', parsed.data.email.toLowerCase())
    .maybeSingle();

  if (!profile) {
    return formError(
      'No existe ninguna cuenta con ese email. El usuario debe registrarse antes de recibir acceso.',
    );
  }

  const isAllAccess = parsed.data.target === 'all_access';

  if (!isAllAccess && !z.string().uuid().safeParse(parsed.data.target).success) {
    return formError('Paquete inválido.');
  }

  const { error } = await supabase.from('entitlements').upsert(
    {
      user_id: profile.id,
      kind: isAllAccess ? 'all_access' : 'package',
      package_id: isAllAccess ? null : parsed.data.target,
      source: 'manual_grant',
      status: 'active',
      // Concesión manual sin caducidad: se retira revocándola explícitamente.
      expires_at: null,
    },
    { onConflict: isAllAccess ? 'user_id' : 'user_id,package_id' },
  );

  if (error) return formError(`No se pudo conceder el acceso: ${error.message}`);

  logger.info('Acceso concedido manualmente', {
    grantedBy: user.id,
    userId: profile.id,
    target: parsed.data.target,
  });

  revalidatePath('/admin/alumnos');
  return formSuccess(`Acceso concedido a ${profile.email}.`);
}

/**
 * Revoca un acceso marcándolo, nunca borrando la fila: el rastro de por qué
 * alguien tuvo acceso es parte de la auditoría.
 */
export async function revokeAccess(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Concesión inválida.');

  const { error } = await supabase
    .from('entitlements')
    .update({ status: 'revoked' })
    .eq('id', id.data);

  if (error) return formError(`No se pudo revocar: ${error.message}`);

  logger.info('Acceso revocado desde el panel', { revokedBy: user.id, entitlementId: id.data });

  revalidatePath('/admin/alumnos');
  return formSuccess('Acceso revocado.');
}

/** Reactiva una concesión revocada por error. */
export async function restoreAccess(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Concesión inválida.');

  const { error } = await supabase
    .from('entitlements')
    .update({ status: 'active' })
    .eq('id', id.data);

  if (error) return formError(`No se pudo restaurar: ${error.message}`);

  revalidatePath('/admin/alumnos');
  return formSuccess('Acceso restaurado.');
}
