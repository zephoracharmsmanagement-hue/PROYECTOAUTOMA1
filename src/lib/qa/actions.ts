'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formError, formSuccess, fromZodError, type FormState } from '@/lib/admin/form';

/**
 * Q&A de miembros.
 *
 * Ninguna de estas acciones comprueba el acceso al paquete: lo hacen las
 * políticas RLS `questions_insert_entitled` y `answers_insert_entitled`, que
 * reutilizan `has_package_access`. Duplicar la comprobación aquí crearía una
 * segunda definición de "tener acceso" que se acabaría desincronizando.
 */

const questionSchema = z.object({
  package_id: z.string().uuid(),
  lesson_id: z.string().uuid().nullable(),
  title: z.string().min(10, 'Resume tu duda en al menos 10 caracteres').max(200),
  body: z.string().min(20, 'Da algo más de contexto: mínimo 20 caracteres').max(4000),
});

export async function askQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return formError('Inicia sesión para preguntar.');

  const lessonId = formData.get('lesson_id');

  const parsed = questionSchema.safeParse({
    package_id: formData.get('package_id'),
    lesson_id: typeof lessonId === 'string' && lessonId.length > 0 ? lessonId : null,
    title: String(formData.get('title') ?? '').trim(),
    body: String(formData.get('body') ?? '').trim(),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await supabase.from('questions').insert({ ...parsed.data, user_id: user.id });

  if (error) {
    // Una violación de política aquí significa exactamente una cosa: no tiene
    // acceso al paquete. Se traduce a un mensaje humano.
    if ((error as { code?: string }).code === '42501') {
      return formError('Necesitas acceso a este paquete para preguntar.');
    }
    return formError(`No se pudo publicar la pregunta: ${error.message}`);
  }

  const packageSlug = String(formData.get('package_slug') ?? '');
  if (packageSlug) revalidatePath(`/biblioteca/${packageSlug}`, 'layout');

  return formSuccess('Pregunta publicada. Te avisaremos cuando haya respuesta.');
}

const answerSchema = z.object({
  question_id: z.string().uuid(),
  body: z.string().min(2, 'La respuesta no puede estar vacía').max(4000),
});

export async function answerQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return formError('Inicia sesión para responder.');

  const parsed = answerSchema.safeParse({
    question_id: formData.get('question_id'),
    body: String(formData.get('body') ?? '').trim(),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  // `is_staff` solo lo acepta la política si quien escribe es admin, así que
  // marcarlo desde el cliente no sirve de nada.
  const asStaff = formData.get('as_staff') === 'on';

  const { error } = await supabase.from('answers').insert({
    question_id: parsed.data.question_id,
    user_id: user.id,
    body: parsed.data.body,
    is_staff: asStaff,
  });

  if (error) {
    if ((error as { code?: string }).code === '42501') {
      return formError('No tienes permiso para responder aquí.');
    }
    return formError(`No se pudo publicar la respuesta: ${error.message}`);
  }

  if (asStaff) {
    // Una respuesta del equipo cierra la pregunta. Si quien escribe no es admin,
    // RLS rechaza esta actualización y la pregunta se queda abierta.
    await supabase
      .from('questions')
      .update({ status: 'answered' })
      .eq('id', parsed.data.question_id);
  }

  const packageSlug = String(formData.get('package_slug') ?? '');
  if (packageSlug) revalidatePath(`/biblioteca/${packageSlug}`, 'layout');
  revalidatePath('/admin/preguntas');

  return formSuccess('Respuesta publicada.');
}
