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

const variantSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_-]+$/, 'Solo minúsculas, números, guiones y guiones bajos'),
  label: z.string().min(1).max(120),
  weight: z.number().int().min(0).max(100),
  payload: z.record(z.string(), z.string()),
});

const experimentSchema = z.object({
  key: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9_]+$/, 'Solo minúsculas, números y guiones bajos'),
  name: z.string().min(3, 'El nombre es obligatorio').max(120),
  hypothesis: z.string().max(600).nullable(),
  variants: z.array(variantSchema).min(2, 'Un experimento necesita al menos dos variantes'),
  is_active: z.boolean(),
});

/**
 * Las variantes se editan como JSON.
 *
 * Es la única parte del panel que expone JSON crudo, y es deliberado: el payload
 * de un experimento es libre por diseño, así que un formulario con campos fijos
 * limitaría lo que se puede probar. Se valida con zod antes de guardar.
 */
function parseVariants(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== 'string' || raw.trim() === '') return [];
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readForm(formData: FormData) {
  const variants = parseVariants(formData.get('variants'));

  return experimentSchema.safeParse({
    key: String(formData.get('key') ?? '')
      .trim()
      .toLowerCase(),
    name: String(formData.get('name') ?? '').trim(),
    hypothesis: optionalText(formData.get('hypothesis')),
    variants,
    is_active: formData.get('is_active') === 'on',
  });
}

export async function saveExperiment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  if (parseVariants(formData.get('variants')) === null) {
    return formError('El JSON de variantes no es válido. Revisa comas y comillas.');
  }

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const totalWeight = parsed.data.variants.reduce((sum, variant) => sum + variant.weight, 0);
  if (totalWeight === 0) {
    return formError('Todas las variantes tienen peso 0: nadie vería el experimento.');
  }

  const ids = new Set(parsed.data.variants.map((variant) => variant.id));
  if (ids.size !== parsed.data.variants.length) {
    return formError('Hay dos variantes con el mismo id.');
  }

  const id = optionalText(formData.get('id'));

  const { error } = id
    ? await supabase.from('experiments').update(parsed.data).eq('id', id)
    : await supabase.from('experiments').insert(parsed.data);

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return formError('Ya existe un experimento con esa clave.');
    }
    return formError(`No se pudo guardar: ${error.message}`);
  }

  revalidatePath('/admin/experimentos');
  revalidatePath('/');
  return formSuccess(id ? 'Experimento guardado.' : 'Experimento creado.');
}

export async function toggleExperiment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = z
    .object({ id: z.string().uuid(), is_active: z.enum(['true', 'false']) })
    .safeParse({ id: formData.get('id'), is_active: formData.get('is_active') });

  if (!parsed.success) return formError('Petición inválida.');

  const isActive = parsed.data.is_active === 'true';

  const { error } = await supabase
    .from('experiments')
    .update({ is_active: isActive })
    .eq('id', parsed.data.id);

  if (error) return formError(`No se pudo cambiar el estado: ${error.message}`);

  revalidatePath('/admin/experimentos');
  revalidatePath('/');

  return formSuccess(
    isActive
      ? 'Experimento activo. A partir de ahora el reparto es estable por visitante.'
      : 'Experimento pausado: todo el mundo ve el contenido por defecto.',
  );
}

export async function deleteExperiment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Experimento inválido.');

  const { error } = await supabase.from('experiments').delete().eq('id', id.data);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidatePath('/admin/experimentos');
  revalidatePath('/');
  return formSuccess('Experimento eliminado.');
}
