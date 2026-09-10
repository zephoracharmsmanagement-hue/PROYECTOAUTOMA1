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

const testimonialSchema = z.object({
  // Cadena vacía = testimonio global, sin paquete asociado.
  package_id: z.string().uuid().nullable(),
  author_name: z.string().min(2, 'El nombre es obligatorio').max(120),
  author_role: z.string().max(160).nullable(),
  author_avatar_url: z.string().url('Debe ser una URL válida').max(500).nullable(),
  quote: z.string().min(20, 'El testimonio debe tener al menos 20 caracteres').max(1200),
  result: z.string().max(160).nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  source_url: z.string().url('Debe ser una URL válida').max(500).nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  sort_order: z.number().int().min(0),
});

function readForm(formData: FormData) {
  const packageId = optionalText(formData.get('package_id'));
  const rating = optionalText(formData.get('rating'));

  return testimonialSchema.safeParse({
    package_id: packageId,
    author_name: String(formData.get('author_name') ?? '').trim(),
    author_role: optionalText(formData.get('author_role')),
    author_avatar_url: optionalText(formData.get('author_avatar_url')),
    quote: String(formData.get('quote') ?? '').trim(),
    result: optionalText(formData.get('result')),
    rating: rating ? Number(rating) : null,
    source_url: optionalText(formData.get('source_url')),
    status: String(formData.get('status') ?? 'draft'),
    sort_order: Number(formData.get('sort_order') ?? 0),
  });
}

function revalidateAll(slug?: string | null) {
  revalidatePath('/admin/testimonios');
  revalidatePath('/');
  if (slug) revalidatePath(`/paquetes/${slug}`);
}

export async function createTestimonial(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await supabase.from('testimonials').insert(parsed.data);
  if (error) return formError(`No se pudo crear el testimonio: ${error.message}`);

  revalidateAll();
  return formSuccess('Testimonio creado.');
}

export async function updateTestimonial(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Testimonio inválido.');

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await supabase.from('testimonials').update(parsed.data).eq('id', id.data);
  if (error) return formError(`No se pudo guardar: ${error.message}`);

  revalidateAll();
  return formSuccess('Testimonio guardado.');
}

export async function deleteTestimonial(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Testimonio inválido.');

  const { error } = await supabase.from('testimonials').delete().eq('id', id.data);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidateAll();
  return formSuccess('Testimonio eliminado.');
}
