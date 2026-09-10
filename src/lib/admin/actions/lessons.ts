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

const lessonSchema = z.object({
  module_id: z.string().uuid(),
  slug: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  title: z.string().min(3, 'El título es obligatorio').max(200),
  description: z.string().max(2000).nullable(),
  provider: z.enum(['bunny', 'mux', 'youtube', 'none']),
  video_asset_id: z.string().max(200).nullable(),
  duration_seconds: z.number().int().min(0).max(86400),
  is_preview: z.boolean(),
  // La transcripción alimenta el índice del asistente. Sin tope se podría pegar
  // un libro entero en un campo de formulario.
  transcript: z.string().max(120000).nullable(),
});

/**
 * Los recursos descargables se editan una línea por recurso:
 *   Etiqueta visible | https://url-del-archivo
 */
function parseResources(raw: FormDataEntryValue | null): Array<{ label: string; url: string }> {
  if (typeof raw !== 'string') return [];

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.lastIndexOf('|');
      if (separator === -1) return null;
      const label = line.slice(0, separator).trim();
      const url = line.slice(separator + 1).trim();
      if (!label || !/^https?:\/\//.test(url)) return null;
      return { label, url };
    })
    .filter((resource): resource is { label: string; url: string } => resource !== null);
}

/** Acepta "22:00", "1:22:00" o segundos sueltos. */
function parseDuration(raw: FormDataEntryValue | null): number {
  if (typeof raw !== 'string' || raw.trim() === '') return 0;

  const parts = raw.trim().split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return 0;

  return parts.reduce((total, part) => total * 60 + part, 0);
}

function readForm(formData: FormData) {
  return lessonSchema.safeParse({
    module_id: formData.get('module_id'),
    slug: String(formData.get('slug') ?? '')
      .trim()
      .toLowerCase(),
    title: String(formData.get('title') ?? '').trim(),
    description: optionalText(formData.get('description')),
    provider: String(formData.get('provider') ?? 'bunny'),
    video_asset_id: optionalText(formData.get('video_asset_id')),
    duration_seconds: parseDuration(formData.get('duration')),
    is_preview: formData.get('is_preview') === 'on',
    transcript: optionalText(formData.get('transcript')),
  });
}

export async function createLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const packageId = z.string().uuid().safeParse(formData.get('package_id'));
  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);
  if (!packageId.success) return formError('Paquete inválido.');

  const { data: last } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('module_id', parsed.data.module_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('lessons').insert({
    ...parsed.data,
    resources: parseResources(formData.get('resources')),
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return formError('Ya existe una lección con ese slug en este módulo.');
    }
    return formError(`No se pudo crear la lección: ${error.message}`);
  }

  revalidatePath(`/admin/paquetes/${packageId.data}`);
  return formSuccess('Lección creada.');
}

export async function updateLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  const packageId = z.string().uuid().safeParse(formData.get('package_id'));
  if (!id.success || !packageId.success) return formError('Petición inválida.');

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await supabase
    .from('lessons')
    .update({ ...parsed.data, resources: parseResources(formData.get('resources')) })
    .eq('id', id.data);

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return formError('Ya existe otra lección con ese slug en este módulo.');
    }
    return formError(`No se pudo guardar: ${error.message}`);
  }

  revalidatePath(`/admin/paquetes/${packageId.data}`);
  return formSuccess('Lección guardada.');
}

export async function deleteLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = z
    .object({ id: z.string().uuid(), package_id: z.string().uuid() })
    .safeParse({ id: formData.get('id'), package_id: formData.get('package_id') });

  if (!parsed.success) return formError('Petición inválida.');

  const { error } = await supabase.from('lessons').delete().eq('id', parsed.data.id);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidatePath(`/admin/paquetes/${parsed.data.package_id}`);
  return formSuccess('Lección eliminada.');
}

/** Intercambia `sort_order` con la lección vecina dentro del mismo módulo. */
export async function moveLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = z
    .object({
      id: z.string().uuid(),
      module_id: z.string().uuid(),
      package_id: z.string().uuid(),
      direction: z.enum(['up', 'down']),
    })
    .safeParse({
      id: formData.get('id'),
      module_id: formData.get('module_id'),
      package_id: formData.get('package_id'),
      direction: formData.get('direction'),
    });

  if (!parsed.success) return formError('Petición inválida.');

  const { data: current } = await supabase
    .from('lessons')
    .select('id, sort_order')
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (!current) return formError('Lección no encontrada.');

  const isUp = parsed.data.direction === 'up';

  const query = supabase
    .from('lessons')
    .select('id, sort_order')
    .eq('module_id', parsed.data.module_id);

  const { data: neighbour } = await (
    isUp
      ? query.lt('sort_order', current.sort_order).order('sort_order', { ascending: false })
      : query.gt('sort_order', current.sort_order).order('sort_order', { ascending: true })
  )
    .limit(1)
    .maybeSingle();

  if (!neighbour) return formSuccess('Ya está en el extremo.');

  await supabase.from('lessons').update({ sort_order: neighbour.sort_order }).eq('id', current.id);
  await supabase.from('lessons').update({ sort_order: current.sort_order }).eq('id', neighbour.id);

  revalidatePath(`/admin/paquetes/${parsed.data.package_id}`);
  return formSuccess('Orden actualizado.');
}
