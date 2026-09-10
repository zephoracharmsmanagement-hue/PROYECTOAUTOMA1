import Link from 'next/link';
import type { CampaignRow } from '@/types/database.types';

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Barra de anuncio de la campaña vigente.
 *
 * Si la campaña tiene código de Stripe, el descuento se aplica solo en el
 * checkout: el código que se muestra aquí es informativo, para que el cliente
 * entienda de dónde sale el precio rebajado.
 */
export function CampaignBanner({ campaign }: { campaign: CampaignRow | null }) {
  if (!campaign) return null;

  const remaining = daysLeft(campaign.ends_at);

  return (
    <div className="border-b border-brand-600/40 bg-brand-500/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-center text-sm">
        <span className="font-semibold text-brand-400">{campaign.headline}</span>

        {campaign.subheadline && <span className="text-mist-200">{campaign.subheadline}</span>}

        {campaign.code_label && (
          <span className="rounded border border-brand-600/60 px-2 py-0.5 font-mono text-xs text-brand-400">
            {campaign.code_label}
          </span>
        )}

        {remaining !== null && (
          <span className="text-xs text-mist-400">
            {remaining === 1 ? 'Último día' : `Quedan ${remaining} días`}
          </span>
        )}

        {campaign.cta_href && campaign.cta_label && (
          <Link href={campaign.cta_href} className="font-semibold underline hover:text-brand-400">
            {campaign.cta_label}
          </Link>
        )}
      </div>
    </div>
  );
}
