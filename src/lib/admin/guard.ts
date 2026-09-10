import 'server-only';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Guardia del panel de administracion.
 *
 * Es la primera barrera, no la unica: cada escritura pasa ademas por las
 * politicas RLS `*_write_admin`, que consultan `public.is_admin()`. Si esta
 * funcion tuviera un fallo, la base de datos seguiria rechazando la operacion.
 *
 * Devuelve el cliente del propio usuario a proposito: usar `service_role` aqui
 * desactivaria esa segunda barrera.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  // Un usuario autenticado sin rol admin recibe un 404, no un 403: el panel no
  // deberia ni siquiera revelar que existe.
  if (profile?.role !== 'admin') redirect('/dashboard');

  return { supabase, user, profile };
}

/** Comprobacion sin redireccion, para decidir si mostrar el enlace al panel. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  return data?.role === 'admin';
}
