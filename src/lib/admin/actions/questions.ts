'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/guard';
import { formError, formSuccess, type FormState } from '@/lib/admin/form';

/** Moderación: ocultar una pregunta, reabrirla o marcarla resuelta. */
export async function setQuestionStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = z
    .object({ id: z.string().uuid(), status: z.enum(['open', 'answered', 'hidden']) })
    .safeParse({ id: formData.get('id'), status: formData.get('status') });

  if (!parsed.success) return formError('Petición inválida.');

  const { error } = await supabase
    .from('questions')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id);

  if (error) return formError(`No se pudo actualizar: ${error.message}`);

  revalidatePath('/admin/preguntas');
  revalidatePath('/biblioteca', 'layout');

  return formSuccess(
    parsed.data.status === 'hidden' ? 'Pregunta oculta para el resto.' : 'Pregunta actualizada.',
  );
}

export async function deleteAnswer(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Respuesta inválida.');

  const { error } = await supabase.from('answers').delete().eq('id', id.data);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidatePath('/admin/preguntas');
  revalidatePath('/biblioteca', 'layout');
  return formSuccess('Respuesta eliminada.');
}
