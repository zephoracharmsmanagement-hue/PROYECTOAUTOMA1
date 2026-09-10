import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { EntitlementRow, PackageRow, SubscriptionRow } from '@/types/database.types';

/**
 * Unico punto de decision de acceso de la aplicacion.
 *
 * Reglas:
 *  1. Una leccion marcada `is_preview` es publica.
 *  2. Un entitlement `package` activo desbloquea ese paquete (compra vitalicia).
 *  3. Un entitlement `all_access` activo desbloquea los paquetes marcados como
 *     `included_in_subscription`.
 *
 * Estas mismas reglas estan replicadas en SQL (`public.has_package_access`) para
 * que RLS proteja los datos aunque un bug de la app olvide comprobarlas.
 */

export interface AccessState {
  userId: string | null;
  hasAllAccess: boolean;
  packageIds: Set<string>;
}

export const ANONYMOUS_ACCESS: AccessState = {
  userId: null,
  hasAllAccess: false,
  packageIds: new Set<string>(),
};

function isLive(e: Pick<EntitlementRow, 'status' | 'expires_at'>): boolean {
  if (e.status !== 'active') return false;
  return e.expires_at === null || new Date(e.expires_at) > new Date();
}

/** Carga en una sola consulta todos los derechos vigentes del usuario actual. */
export async function getAccessState(): Promise<AccessState> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return ANONYMOUS_ACCESS;

  const { data, error } = await supabase
    .from('entitlements')
    .select('id, kind, package_id, status, expires_at')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) {
    // Ante un fallo de lectura se deniega el acceso: nunca se abre por defecto.
    return { userId: user.id, hasAllAccess: false, packageIds: new Set() };
  }

  const rows = (data ?? []) as Array<
    Pick<EntitlementRow, 'id' | 'kind' | 'package_id' | 'status' | 'expires_at'>
  >;

  const live = rows.filter(isLive);

  return {
    userId: user.id,
    hasAllAccess: live.some((e) => e.kind === 'all_access'),
    packageIds: new Set(
      live.filter((e) => e.kind === 'package' && e.package_id).map((e) => e.package_id as string),
    ),
  };
}

/** ¿Este estado de acceso desbloquea el paquete dado? */
export function canAccessPackage(
  access: AccessState,
  pkg: Pick<PackageRow, 'id' | 'included_in_subscription'>,
): boolean {
  if (access.packageIds.has(pkg.id)) return true;
  return access.hasAllAccess && pkg.included_in_subscription;
}

/** Suscripciones de Stripe cuyo estado concede acceso. */
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function isSubscriptionActive(sub: Pick<SubscriptionRow, 'status'>): boolean {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(sub.status);
}
