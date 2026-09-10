'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/guard';
import { formError, formSuccess, type FormState } from '@/lib/admin/form';

/**
 * Reconstruye el índice del asistente para un paquete.
 *
 * Es una acción explícita y no un disparador automático al guardar una lección:
 * reindexar borra y reescribe todos los fragmentos del paquete, y hacerlo en
 * cada pulsación de "guardar" sería trabajo desperdiciado mientras se edita.
 */
export async function reindexPackage(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Paquete inválido.');

  const { data, error } = await supabase.rpc('reindex_package_content', {
    p_package_id: id.data,
  });

  if (error) return formError(`No se pudo reindexar: ${error.message}`);

  revalidatePath(`/admin/paquetes/${id.data}`);

  const chunks = data ?? 0;

  if (chunks === 0) {
    return formError(
      'No se ha indexado nada. Las lecciones necesitan descripción o transcripción para que el asistente tenga algo que leer.',
    );
  }

  return formSuccess(`Índice reconstruido: ${chunks} fragmento(s).`);
}
