import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Nombre de archivo seguro a partir del nombre de la automatización. */
function toFilename(name: string, platform: string): string {
  const slug =
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'automatizacion';

  return `${slug}-${platform}.json`;
}

/**
 * Descarga del flujo de automatización.
 *
 * No hay comprobación de acceso explícita aquí: se usa el cliente del propio
 * usuario y la política `automations_select_entitled` ya limita la lectura a
 * quien tiene acceso al paquete. Si no lo tiene, la consulta simplemente no
 * devuelve fila y la respuesta es un 404 — que además no revela si el recurso
 * existe.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = z
    .string()
    .uuid()
    .safeParse((await context.params).id);
  if (!parsed.success) {
    return Response.json({ error: 'Automatización inválida.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: automation, error } = await supabase
    .from('automations')
    .select('name, platform, version, workflow')
    .eq('id', parsed.data)
    .maybeSingle();

  if (error) {
    logger.error('Fallo leyendo la automatización', { id: parsed.data, message: error.message });
    return Response.json({ error: 'No se pudo preparar la descarga.' }, { status: 500 });
  }

  if (!automation) {
    return Response.json({ error: 'No encontrada.' }, { status: 404 });
  }

  const filename = toFilename(automation.name, automation.platform);

  return new Response(JSON.stringify(automation.workflow, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Contenido de pago: ningún proxy debe guardarlo.
      'Cache-Control': 'private, no-store',
    },
  });
}
