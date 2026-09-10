import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import { ANONYMOUS_ID_COOKIE } from '@/lib/experiments.shared';
import type { Database } from '@/types/database.types';

/** Rutas que exigen sesion iniciada. */
const PROTECTED_PREFIXES = ['/dashboard', '/biblioteca', '/cuenta', '/admin'];

/**
 * Refresca el token de Supabase en cada request y protege el area de miembros.
 * El gating fino (que paquete puede ver cada usuario) NO se hace aqui: vive en
 * RLS y en `lib/entitlements`, para que un fallo de middleware no abra contenido.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Identificador anonimo estable: es lo que hace determinista el reparto de
  // variantes A/B. No contiene datos personales ni se comparte con terceros.
  if (!request.cookies.get(ANONYMOUS_ID_COOKIE)) {
    response.cookies.set(ANONYMOUS_ID_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
