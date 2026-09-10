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

const moduleSchema = z.object({
  package_id: z.string().uuid(),
  title: z.string().min(3, 'El título es obligatorio').max(200),
  summary: z.string().max(600).nullable(),
});

function readForm(formData: FormData) {
  return moduleSchema.safeParse({
    package_id: formData.get('package_id'),
    title: String(formData.get('title') ?? '').trim(),
    summary: optionalText(formData.get('summary')),
  });
}

export async function createModule(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  // El nuevo módulo se coloca al final: reordenar es una acción aparte.
  const { data: last } = await supabase
    .from('modules')
    .select('sort_order')
    .eq('package_id', parsed.data.package_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from('modules')
    .insert({ ...parsed.data, sort_order: (last?.sort_order ?? 0) + 1 });

  if (error) return formError(`No se pudo crear el módulo: ${error.message}`);

  revalidatePath(`/admin/paquetes/${parsed.data.package_id}`);
  return formSuccess('Módulo creado.');
}

export async function updateModule(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Módulo inválido.');

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await supabase
    .from('modules')
    .update({ title: parsed.data.title, summary: parsed.data.summary })
    .eq('id', id.data);

  if (error) return formError(`No se pudo guardar: ${error.message}`);

  revalidatePath(`/admin/paquetes/${parsed.data.package_id}`);
  return formSuccess('Módulo guardado.');
}

export async function deleteModule(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = z
    .object({ id: z.string().uuid(), package_id: z.string().uuid() })
    .safeParse({ id: formData.get('id'), package_id: formData.get('package_id') });

  if (!parsed.success) return formError('Petición inválida.');

  // Las lecciones caen en cascada; se avisa en la interfaz antes de confirmar.
  const { error } = await supabase.from('modules').delete().eq('id', parsed.data.id);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidatePath(`/admin/paquetes/${parsed.data.package_id}`);
  return formSuccess('Módulo eliminado.');
}

/**
 * Reordena intercambiando `sort_order` con el vecino en la dirección pedida.
 * Es una operación local: no reescribe toda la lista, así que dos ediciones
 * simultáneas en módulos distintos no se pisan.
 */
export async function moveModule(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = z
    .object({
      id: z.string().uuid(),
      package_id: z.string().uuid(),
      direction: z.enum(['up', 'down']),
    })
    .safeParse({
      id: formData.get('id'),
      package_id: formData.get('package_id'),
      direction: formData.get('direction'),
    });

  if (!parsed.success) return formError('Petición inválida.');

  const { data: current } = await supabase
    .from('modules')
    .select('id, sort_order')
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (!current) return formError('Módulo no encontrado.');

  const isUp = parsed.data.direction === 'up';

  const query = supabase
    .from('modules')
    .select('id, sort_order')
    .eq('package_id', parsed.data.package_id);

  const { data: neighbour } = await (
    isUp
      ? query.lt('sort_order', current.sort_order).order('sort_order', { ascending: false })
      : query.gt('sort_order', current.sort_order).order('sort_order', { ascending: true })
  )
    .limit(1)
    .maybeSingle();

  if (!neighbour) return formSuccess('Ya está en el extremo.');

  await supabase.from('modules').update({ sort_order: neighbour.sort_order }).eq('id', current.id);
  await supabase.from('modules').update({ sort_order: current.sort_order }).eq('id', neighbour.id);

  revalidatePath(`/admin/paquetes/${parsed.data.package_id}`);
  return formSuccess('Orden actualizado.');
}
