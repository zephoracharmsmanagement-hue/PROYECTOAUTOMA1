import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().email().max(254),
  source: z.string().min(1).max(60).default('landing'),
});

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: 'Introduce un email válido.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('leads').insert({
    email: parsed.data.email.toLowerCase(),
    source: parsed.data.source,
  });

  // 23505 = ya estaba suscrito. Para el visitante es un exito, no un error.
  if (error && (error as { code?: string }).code !== '23505') {
    logger.error('No se pudo guardar el lead', { message: error.message });
    return NextResponse.json({ error: 'No pudimos guardar tu email.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
