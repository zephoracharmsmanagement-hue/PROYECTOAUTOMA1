'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const inputSchema = z.object({
  lessonId: z.string().uuid(),
  packageSlug: z.string().min(1).max(120),
});

/**
 * Marca una lección como completada.
 *
 * Se ejecuta con el cliente del usuario (no service_role): la política RLS
 * `progress_upsert_own` vuelve a comprobar el entitlement, de modo que aunque
 * alguien invoque la acción con un lessonId ajeno la escritura es rechazada.
 */
export async function markLessonComplete(input: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: 'Sesión expirada.' };

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      user_id: user.id,
      lesson_id: parsed.data.lessonId,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' },
  );

  if (error) return { ok: false as const, error: 'No se pudo guardar tu progreso.' };

  revalidatePath(`/biblioteca/${parsed.data.packageSlug}`);
  return { ok: true as const };
}
