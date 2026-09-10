'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

const slugSchema = z
  .string()
  .min(3, 'Mínimo 3 caracteres')
  .max(120, 'Máximo 120 caracteres')
  .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones');

const packageSchema = z.object({
  slug: slugSchema,
  title: z.string().min(3, 'El título es obligatorio').max(200),
  subtitle: z.string().max(200).nullable(),
  outcome: z.string().max(400).nullable(),
  description: z.string().max(4000).nullable(),
  category: z.string().min(1).max(60),
  level: z.string().min(1).max(60),
  cover_url: z.string().url('Debe ser una URL válida').max(500).nullable(),
  price_one_time_cents: z.number().int().min(0).nullable(),
  compare_at_price_cents: z.number().int().min(0).nullable(),
  currency: z.string().length(3, 'Usa el código ISO de 3 letras').toLowerCase(),
  stripe_price_id_one_time: z
    .string()
    .regex(/^price_[A-Za-z0-9]+$/, 'Debe empezar por price_')
    .nullable(),
  included_in_subscription: z.boolean(),
  status: z.enum(['draft', 'published', 'archived']),
  sort_order: z.number().int().min(0),
});

/**
 * Los bullets de valor se editan como texto plano, una línea por bullet:
 *   Título del bullet | Detalle explicativo
 * Evita una interfaz de repetidor compleja sin perder estructura en la base.
 */
function parseFeatures(raw: FormDataEntryValue | null): Array<{ title: string; detail: string }> {
  if (typeof raw !== 'string') return [];

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split('|');
      return { title: (title ?? '').trim(), detail: rest.join('|').trim() };
    })
    .filter((feature) => feature.title.length > 0);
}

function readPackageForm(formData: FormData) {
  return packageSchema.safeParse({
    slug: String(formData.get('slug') ?? '')
      .trim()
      .toLowerCase(),
    title: String(formData.get('title') ?? '').trim(),
    subtitle: optionalText(formData.get('subtitle')),
    outcome: optionalText(formData.get('outcome')),
    description: optionalText(formData.get('description')),
    category: String(formData.get('category') ?? 'ecommerce').trim(),
    level: String(formData.get('level') ?? 'intermedio').trim(),
    cover_url: optionalText(formData.get('cover_url')),
    price_one_time_cents: toCents(formData.get('price_one_time')),
    compare_at_price_cents: toCents(formData.get('compare_at_price')),
    currency: String(formData.get('currency') ?? 'usd').trim(),
    stripe_price_id_one_time: optionalText(formData.get('stripe_price_id_one_time')),
    included_in_subscription: formData.get('included_in_subscription') === 'on',
    status: String(formData.get('status') ?? 'draft'),
    sort_order: Number(formData.get('sort_order') ?? 0),
  });
}

/**
 * Un paquete publicado sin precio ni price id no se puede comprar: sería una
 * ficha de venta sin botón. Se bloquea antes de guardar en lugar de dejar que
 * el fallo aparezca en producción.
 */
function validatePublishable(data: z.infer<typeof packageSchema>): FormState | null {
  if (data.status !== 'published') return null;
  if (data.included_in_subscription && !data.price_one_time_cents) return null;

  if (!data.price_one_time_cents || !data.stripe_price_id_one_time) {
    return formError(
      'Para publicar un paquete de pago único necesitas precio y price id de Stripe, ' +
        'o marcarlo como incluido en la membresía.',
    );
  }

  return null;
}

export async function createPackage(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = readPackageForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const blocked = validatePublishable(parsed.data);
  if (blocked) return blocked;

  const { data, error } = await supabase
    .from('packages')
    .insert({ ...parsed.data, features: parseFeatures(formData.get('features')) })
    .select('id')
    .single();

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return formError('Ya existe un paquete con ese slug o ese price id de Stripe.');
    }
    return formError(`No se pudo crear el paquete: ${error.message}`);
  }

  revalidatePath('/admin/paquetes');
  revalidatePath('/paquetes');
  redirect(`/admin/paquetes/${data.id}`);
}

export async function updatePackage(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Paquete inválido.');

  const parsed = readPackageForm(formData);
  if (!parsed.success) return fromZodError(parsed.error);

  const blocked = validatePublishable(parsed.data);
  if (blocked) return blocked;

  const { error } = await supabase
    .from('packages')
    .update({ ...parsed.data, features: parseFeatures(formData.get('features')) })
    .eq('id', id.data);

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return formError('Ya existe otro paquete con ese slug o ese price id de Stripe.');
    }
    return formError(`No se pudo guardar: ${error.message}`);
  }

  revalidatePath('/admin/paquetes');
  revalidatePath(`/admin/paquetes/${id.data}`);
  revalidatePath('/paquetes');
  revalidatePath(`/paquetes/${parsed.data.slug}`);

  return formSuccess('Paquete guardado.');
}

/** Publica o despublica sin abrir el formulario completo. */
export async function setPackageStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(['draft', 'published', 'archived']),
    })
    .safeParse({ id: formData.get('id'), status: formData.get('status') });

  if (!parsed.success) return formError('Petición inválida.');

  const { data: pkg } = await supabase
    .from('packages')
    .select(
      'slug, title, subtitle, outcome, description, category, level, cover_url, price_one_time_cents, compare_at_price_cents, currency, stripe_price_id_one_time, included_in_subscription, sort_order',
    )
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (!pkg) return formError('Paquete no encontrado.');

  const blocked = validatePublishable({ ...pkg, status: parsed.data.status });
  if (blocked) return blocked;

  const { error } = await supabase
    .from('packages')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id);

  if (error) return formError(`No se pudo cambiar el estado: ${error.message}`);

  revalidatePath('/admin/paquetes');
  revalidatePath('/paquetes');
  revalidatePath(`/paquetes/${pkg.slug}`);

  return formSuccess(
    parsed.data.status === 'published' ? 'Paquete publicado.' : 'Paquete despublicado.',
  );
}

/**
 * Borrado definitivo. Solo se permite si nadie lo ha comprado nunca: eliminar un
 * paquete con ventas destruiría el historial de facturación por cascada.
 */
export async function deletePackage(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Paquete inválido.');

  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('package_id', id.data);

  if ((count ?? 0) > 0) {
    return formError(
      'Este paquete tiene ventas registradas. Archívalo en lugar de borrarlo para conservar el historial.',
    );
  }

  const { error } = await supabase.from('packages').delete().eq('id', id.data);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidatePath('/admin/paquetes');
  revalidatePath('/paquetes');
  redirect('/admin/paquetes');
}
