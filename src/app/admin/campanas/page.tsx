import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { CampaignForm } from '@/components/admin/campaign-form';
import { Badge } from '@/components/ui/badge';
import { deleteCampaign } from '@/lib/admin/actions/campaigns';
import { requireAdmin } from '@/lib/admin/guard';
import { isLive } from '@/lib/campaigns';

export const metadata: Metadata = { title: 'Campañas' };

export default async function AdminCampaignsPage() {
  const { supabase } = await requireAdmin();

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  const list = campaigns ?? [];
  const liveCount = list.filter(isLive).length;

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold">Campañas</h2>
      <p className="mt-1 text-sm text-mist-400">
        Una campaña vigente muestra una barra de anuncio en todo el sitio. Si tiene código
        promocional de Stripe, el descuento se aplica solo en el checkout: nadie tiene que teclear
        nada.
      </p>

      {liveCount > 1 && (
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Hay {liveCount} campañas vigentes a la vez. Solo se muestra y se aplica la más reciente;
          desactiva las demás para evitar confusión.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-5">
        {list.map((campaign) => (
          <div key={campaign.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge className={isLive(campaign) ? 'border-brand-600 text-brand-400' : undefined}>
                {isLive(campaign) ? 'vigente' : campaign.is_active ? 'programada' : 'inactiva'}
              </Badge>
              <span className="text-mist-400">{campaign.name}</span>
              <ActionButton
                action={deleteCampaign}
                fields={{ id: campaign.id }}
                confirm={`¿Eliminar la campaña "${campaign.name}"?`}
                variant="ghost"
              >
                Eliminar
              </ActionButton>
            </div>
            <CampaignForm campaign={campaign} />
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          Todavía no hay campañas.
        </p>
      )}

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Crear campaña</h3>
        <div className="mt-4">
          <CampaignForm />
        </div>
      </div>
    </div>
  );
}
