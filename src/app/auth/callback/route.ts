import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Intercambia el código del magic link por una sesión con cookies. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next');

  // Solo rutas internas: bloquea open redirects hacia dominios de terceros.
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?error=invalid_code', url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
