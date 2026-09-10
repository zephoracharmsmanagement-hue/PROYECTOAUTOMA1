import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { signPlayback, VideoProviderError } from '@/lib/video';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ lessonId: z.string().uuid() });

/**
 * Devuelve un enlace de reproduccion firmado y efimero.
 *
 * Es el unico punto de la aplicacion que expone un video, y comprueba el
 * entitlement ANTES de firmar. Las lecciones marcadas `is_preview` se sirven sin
 * sesion como gancho de conversion.
 */
export async function GET(_request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Lección inválida.' }, { status: 400 });
  }
  const { lessonId } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se lee con service_role porque RLS oculta `video_asset_id`; la autorizacion
  // se resuelve explicitamente unas lineas mas abajo.
  const admin = createSupabaseAdminClient();
  const { data: lesson, error } = await admin
    .from('lessons')
    .select('id, title, provider, video_asset_id, is_preview, module_id, modules!inner(package_id)')
    .eq('id', lessonId)
    .single<{
      id: string;
      title: string;
      provider: 'bunny' | 'mux' | 'youtube' | 'none';
      video_asset_id: string | null;
      is_preview: boolean;
      module_id: string;
      modules: { package_id: string };
    }>();

  if (error || !lesson) {
    return NextResponse.json({ error: 'Lección no encontrada.' }, { status: 404 });
  }

  if (!lesson.is_preview) {
    if (!user) {
      return NextResponse.json({ error: 'Inicia sesión para ver esta lección.' }, { status: 401 });
    }

    // Se delega en la misma funcion SQL que respalda RLS: una sola definicion
    // de "tener acceso" para toda la plataforma.
    const { data: allowed, error: accessError } = await admin.rpc('has_package_access', {
      p_user_id: user.id,
      p_package_id: lesson.modules.package_id,
    });

    if (accessError) {
      logger.error('Fallo comprobando acceso a la lección', {
        lessonId,
        message: accessError.message,
      });
      return NextResponse.json({ error: 'No se pudo verificar tu acceso.' }, { status: 500 });
    }

    if (!allowed) {
      return NextResponse.json({ error: 'No tienes acceso a esta lección.' }, { status: 403 });
    }
  }

  try {
    const playback = await signPlayback(lesson.provider, lesson.video_asset_id);
    return NextResponse.json(playback, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof VideoProviderError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    logger.error('Fallo firmando la reproducción', {
      lessonId,
      message: error instanceof Error ? error.message : 'desconocido',
    });
    return NextResponse.json({ error: 'No se pudo preparar el video.' }, { status: 500 });
  }
}
