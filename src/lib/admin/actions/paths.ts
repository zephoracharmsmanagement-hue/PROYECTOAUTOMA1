'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/guard';
import {
  formError,
  formSuccess,
  fromZodError,
  optionalText,
  toCents,
  type FormState,
} from '@/lib/admin/form';

const pathSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  title: z.string().min(3, 'El título es obligatorio').max(200),
  subtitle: z.string().max(200).nullable(),
  outcome: z.string().max(400).nullable(),
  description: z.string().max(4000).nullable(),
  cover_url: z.string().url('Debe ser una URL válida').max(500).nullable(),
  price_one_time_cents: z.number().int().min(0).nullable(),
  currency: z.string().length(3).toLowerCase(),
  stripe_price_id_one_time: z
    .string()
    .regex(/^price_[A-Za-z0-9]+$/, 'Debe empezar por price_')
    .nullable(),
  included_in_subscription: z.boolean(),
  status: z.enum(['draft', 'published', 'archived']),
  sort_order: z.number().int().min(0),
});

/**
 * Los paquetes de la ruta se editan como texto, uno por línea y en orden:
 *   slug-del-paquete | por qué va aquí
 */
function parseMembers(
  raw: FormDataEntryValue | null,
): Array<{ slug: string; note: string | null }> {
  if (typeof raw !== 'string') return [];

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [slug, ...rest] = line.split('|');
      const note = rest.join('|').trim();
      return { slug: (slug ?? '').trim().toLowerCase(), note: note || null };
    })
    .filter((member) => member.slug.length > 0);
}

function readForm(formData: FormData) {
  return pathSchema.safeParse({
    slug: String(formData.get('slug') ?? '')
      .trim()
      .toLowerCase(),
    title: String(formData.get('title') ?? '').trim(),
    subtitle: optionalText(formData.get('subtitle')),
    outcome: optionalText(formData.get('outcome')),
    description: optionalText(formData.get('description')),
    cover_url: optionalText(formData.get('cover_url')),
    price_one_time_cents: toCents(formData.get('price')),
    currency: String(formData.get('currency') ?? 'usd').trim(),
    stripe_price_id_one_time: optionalText(formData.get('stripe_price_id_one_time')),
    included_in_subscription: formData.get('included_in_subscription') === 'on',
    status: String(formData.get('status') ?? 'draft'),
    sort_order: Number(formData.get('sort_order') ?? 0),
  });
}

export async function savePath(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = readForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const members = parseMembers(formData.get('members'));

  // Publicar un lote sin precio real de Stripe es un botón de compra roto.
  if (
    parsed.data.status === 'published' &&
    parsed.data.price_one_time_cents &&
    !parsed.data.stripe_price_id_one_time
  ) {
    return formError('Para publicar una ruta con precio necesitas su price id de Stripe.');
  }

  if (parsed.data.status === 'published' && members.length < 2) {
    return formError('Una ruta publicada debe encadenar al menos dos paquetes.');
  }

  const id = optionalText(formData.get('id'));

  const { data: saved, error } = id
    ? await supabase.from('paths').update(parsed.data).eq('id', id).select('id').single()
    : await supabase.from('paths').insert(parsed.data).select('id').single();

  if (error || !saved) {
    if ((error as { code?: string } | null)?.code === '23505') {
      return formError('Ya existe una ruta con ese slug o ese price id.');
    }
    return formError(`No se pudo guardar: ${error?.message ?? 'error desconocido'}`);
  }

  if (members.length > 0) {
    const { data: packages } = await supabase
      .from('packages')
      .select('id, slug')
      .in(
        'slug',
        members.map((member) => member.slug),
      );

    const bySlug = new Map((packages ?? []).map((pkg) => [pkg.slug, pkg.id]));
    const missing = members.filter((member) => !bySlug.has(member.slug));

    if (missing.length > 0) {
      return formError(
        `Estos slugs no corresponden a ningún paquete: ${missing.map((m) => m.slug).join(', ')}`,
      );
    }

    // Se reemplaza la composición entera: es lo que hace que el orden del
    // textarea sea la fuente de verdad y no haya filas huérfanas.
    await supabase.from('path_packages').delete().eq('path_id', saved.id);

    const { error: membersError } = await supabase.from('path_packages').insert(
      members.map((member, index) => ({
        path_id: saved.id,
        package_id: bySlug.get(member.slug) as string,
        note: member.note,
        sort_order: index + 1,
      })),
    );

    if (membersError) {
      return formError(`Ruta guardada, pero falló su composición: ${membersError.message}`);
    }
  }

  revalidatePath('/admin/rutas');
  revalidatePath('/rutas');
  revalidatePath(`/rutas/${parsed.data.slug}`);

  return formSuccess(id ? 'Ruta guardada.' : 'Ruta creada.');
}

export async function deletePath(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Ruta inválida.');

  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('path_id', id.data);

  if ((count ?? 0) > 0) {
    return formError('Esta ruta tiene ventas. Archívala en lugar de borrarla.');
  }

  const { error } = await supabase.from('paths').delete().eq('id', id.data);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidatePath('/admin/rutas');
  revalidatePath('/rutas');
  return formSuccess('Ruta eliminada.');
}
