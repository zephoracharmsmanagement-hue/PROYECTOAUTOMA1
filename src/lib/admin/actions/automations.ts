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

/** Un flujo exportado grande sigue siendo texto: 1 MB es un tope holgado. */
const MAX_WORKFLOW_BYTES = 1_000_000;

/**
 * Patrones que delatan credenciales reales dentro de un export.
 *
 * No es un detector infalible ni pretende serlo: es una red de seguridad contra
 * el error más caro y más fácil de cometer, que es pegar un flujo exportado con
 * las claves dentro y repartirlo a todos los alumnos.
 */
const SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /sk-[A-Za-z0-9]{20,}/, label: 'clave de OpenAI (sk-…)' },
  { pattern: /sk_live_[A-Za-z0-9]{10,}/, label: 'clave secreta de Stripe (sk_live_…)' },
  { pattern: /sk-ant-[A-Za-z0-9-]{20,}/, label: 'clave de Anthropic (sk-ant-…)' },
  { pattern: /AIza[0-9A-Za-z_-]{30,}/, label: 'clave de Google (AIza…)' },
  { pattern: /xox[baprs]-[0-9A-Za-z-]{10,}/, label: 'token de Slack (xox…)' },
  { pattern: /ghp_[A-Za-z0-9]{20,}/, label: 'token de GitHub (ghp_…)' },
  {
    pattern: /"(access_token|refresh_token|client_secret)"\s*:\s*"[^"]{12,}"/,
    label: 'token OAuth',
  },
];

const automationSchema = z.object({
  package_id: z.string().uuid('Selecciona el paquete'),
  lesson_id: z.string().uuid().nullable(),
  name: z.string().min(3, 'El nombre es obligatorio').max(160),
  description: z.string().max(1000).nullable(),
  platform: z.enum(['n8n', 'make', 'zapier', 'other']),
  version: z.string().max(20),
  setup_notes: z.string().max(4000).nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  sort_order: z.number().int().min(0),
});

export async function saveAutomation(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const rawWorkflow = String(formData.get('workflow') ?? '').trim();

  if (rawWorkflow.length === 0) return formError('Pega el flujo exportado en JSON.');
  if (Buffer.byteLength(rawWorkflow, 'utf8') > MAX_WORKFLOW_BYTES) {
    return formError('El flujo supera 1 MB. Divídelo o quita datos de ejemplo.');
  }

  let workflow: unknown;
  try {
    workflow = JSON.parse(rawWorkflow);
  } catch {
    return formError('El JSON del flujo no es válido. Revisa comas y comillas.');
  }

  const found = SECRET_PATTERNS.find((entry) => entry.pattern.test(rawWorkflow));
  if (found) {
    return formError(
      `El flujo parece contener una ${found.label}. Vuelve a exportarlo sin credenciales: se distribuiría tal cual a todos los alumnos.`,
    );
  }

  const lessonId = optionalText(formData.get('lesson_id'));

  const parsed = automationSchema.safeParse({
    package_id: formData.get('package_id'),
    lesson_id: lessonId,
    name: String(formData.get('name') ?? '').trim(),
    description: optionalText(formData.get('description')),
    platform: String(formData.get('platform') ?? 'n8n'),
    version: String(formData.get('version') ?? '1.0.0').trim(),
    setup_notes: optionalText(formData.get('setup_notes')),
    status: String(formData.get('status') ?? 'draft'),
    sort_order: Number(formData.get('sort_order') ?? 0),
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const requires = String(formData.get('requires') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const payload = { ...parsed.data, workflow: workflow as never, requires: requires as never };
  const id = optionalText(formData.get('id'));

  const { error } = id
    ? await supabase.from('automations').update(payload).eq('id', id)
    : await supabase.from('automations').insert(payload);

  if (error) return formError(`No se pudo guardar: ${error.message}`);

  revalidatePath('/admin/automatizaciones');
  revalidatePath('/biblioteca', 'layout');
  revalidatePath('/paquetes', 'layout');

  return formSuccess(id ? 'Automatización guardada.' : 'Automatización creada.');
}

export async function deleteAutomation(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return formError('Automatización inválida.');

  const { error } = await supabase.from('automations').delete().eq('id', id.data);
  if (error) return formError(`No se pudo borrar: ${error.message}`);

  revalidatePath('/admin/automatizaciones');
  revalidatePath('/biblioteca', 'layout');
  return formSuccess('Automatización eliminada.');
}
