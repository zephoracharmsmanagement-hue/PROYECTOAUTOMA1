import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { publicEnv, serverEnv } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Cliente con `service_role`: BYPASSA RLS por completo.
 *
 * Uso permitido unicamente en:
 *   - el webhook de Stripe (conceder entitlements, registrar ordenes),
 *   - tareas administrativas de servidor.
 *
 * Nunca debe alcanzarse desde codigo que corra en el navegador. El import de
 * `server-only` hace fallar el build si alguien lo intenta.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
