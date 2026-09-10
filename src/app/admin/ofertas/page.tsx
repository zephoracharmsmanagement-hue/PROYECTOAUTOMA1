import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { OfferForm } from '@/components/admin/offer-form';
import { Badge } from '@/components/ui/badge';
import { deleteOffer } from '@/lib/admin/actions/offers';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = { title: 'Ofertas' };

export default async function AdminOffersPage() {
  const { supabase } = await requireAdmin();

  const [{ data: offers }, { data: packages }] = await Promise.all([
    supabase.from('offers').select('*').order('sort_order'),
    supabase.from('packages').select('id, title').order('sort_order'),
  ]);

  const list = offers ?? [];
  const packageList = packages ?? [];
  const titleOf = (id: string) => packageList.find((pkg) => pkg.id === id)?.title ?? '—';

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold">Order bumps y upsells</h2>
      <p className="mt-1 text-sm text-mist-400">
        Un <strong>order bump</strong> es una casilla en la ficha de venta que añade un segundo
        paquete al mismo pago. Un <strong>upsell</strong> se ofrece después de comprar, en la página
        de confirmación. Nunca se muestra a quien ya tiene el paquete ofrecido.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        {list.map((offer) => (
          <div key={offer.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge className={offer.is_active ? 'border-brand-600 text-brand-400' : undefined}>
                {offer.placement === 'bump' ? 'order bump' : 'upsell'}
              </Badge>
              <span className="text-mist-400">
                {titleOf(offer.source_package_id)} → {titleOf(offer.offer_package_id)}
              </span>
              <ActionButton
                action={deleteOffer}
                fields={{ id: offer.id }}
                confirm="¿Eliminar esta oferta? Dejará de mostrarse de inmediato."
                variant="ghost"
              >
                Eliminar
              </ActionButton>
            </div>
            <OfferForm offer={offer} packages={packageList} />
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          Todavía no hay ofertas configuradas.
        </p>
      )}

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Crear oferta</h3>
        <div className="mt-4">
          <OfferForm packages={packageList} />
        </div>
      </div>
    </div>
  );
}
