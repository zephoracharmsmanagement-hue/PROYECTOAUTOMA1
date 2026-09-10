import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CampaignRow } from '@/types/database.types';

/**
 * Campaña vigente ahora mismo, si la hay.
 *
 * "Activa" no basta: la ventana temporal manda. Así se puede dejar una campaña
 * programada de antemano y que se apague sola al terminar, sin depender de que
 * alguien entre al panel a desactivarla el día correcto.
 */
export function isLive(
  campaign: Pick<CampaignRow, 'is_active' | 'starts_at' | 'ends_at'>,
): boolean {
  if (!campaign.is_active) return false;

  const now = Date.now();
  if (campaign.starts_at && new Date(campaign.starts_at).getTime() > now) return false;
  if (campaign.ends_at && new Date(campaign.ends_at).getTime() <= now) return false;

  return true;
}

export async function getActiveCampaign(): Promise<CampaignRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  return (data ?? []).find(isLive) ?? null;
}
