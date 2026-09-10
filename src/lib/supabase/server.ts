import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Respeta RLS: actua como el usuario autenticado de la cookie.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Los Server Components no pueden escribir cookies. El refresco de
            // sesion lo realiza el middleware, asi que se puede ignorar.
          }
        },
      },
    },
  );
}

/**
 * Devuelve el usuario autenticado o `null`.
 * Usa `getUser()` (valida el JWT contra el servidor de auth), nunca `getSession()`,
 * cuyo payload proviene de una cookie y no debe usarse para autorizar.
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
