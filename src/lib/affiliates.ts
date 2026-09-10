import 'server-only';

import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { REFERRAL_COOKIE } from '@/lib/affiliates.shared';

export { REFERRAL_COOKIE, REFERRAL_PARAM } from '@/lib/affiliates.shared';

/**
 * Resuelve el afiliado al que hay que atribuir una compra.
 *
 * Orden de prioridad:
 *  1. Atribución ya guardada en el perfil. Una vez que un cliente entra por un
 *     afiliado, sus renovaciones le siguen contando aunque la cookie caduque.
 *  2. Cookie de la visita actual (last-click, 90 días).
 *
 * Un afiliado nunca cobra comisión por su propia compra.
 */
export async function resolveAffiliateId(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('referred_by_affiliate_id')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.referred_by_affiliate_id) return profile.referred_by_affiliate_id;

  const cookieStore = await cookies();
  const code = cookieStore.get(REFERRAL_COOKIE)?.value;
  if (!code) return null;

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, user_id, is_active')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (!affiliate || affiliate.user_id === userId) return null;

  // Se fija la atribución en el perfil para que sobreviva a la cookie.
  await admin
    .from('profiles')
    .update({ referred_by_affiliate_id: affiliate.id })
    .eq('id', userId)
    .is('referred_by_affiliate_id', null);

  return affiliate.id;
}
