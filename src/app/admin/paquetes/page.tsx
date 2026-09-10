import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionButton } from '@/components/admin/action-button';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { setPackageStatus } from '@/lib/admin/actions/packages';
import { requireAdmin } from '@/lib/admin/guard';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Paquetes' };

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
};

export default async function AdminPackagesPage() {
  const { supabase } = await requireAdmin();

  const { data: packages } = await supabase
    .from('packages')
    .select(
      'id, slug, title, status, price_one_time_cents, currency, included_in_subscription, sort_order',
    )
    .order('sort_order');

  const list = packages ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Paquetes</h2>
          <p className="mt-1 text-sm text-mist-400">
            Publicar un paquete lo hace visible de inmediato en el catálogo público.
          </p>
        </div>
        <ButtonLink href="/admin/paquetes/nuevo">Nuevo paquete</ButtonLink>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {list.map((pkg) => (
          <div
            key={pkg.id}
            className="card-surface flex flex-wrap items-center justify-between gap-4 rounded-xl p-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/paquetes/${pkg.id}`}
                  className="font-semibold hover:text-brand-400"
                >
                  {pkg.title}
                </Link>
                <Badge
                  className={
                    pkg.status === 'published' ? 'border-brand-600 text-brand-400' : undefined
                  }
                >
                  {STATUS_LABEL[pkg.status] ?? pkg.status}
                </Badge>
                {pkg.included_in_subscription && <Badge>en membresía</Badge>}
              </div>
              <p className="mt-1 text-xs text-mist-400">
                /paquetes/{pkg.slug} ·{' '}
                {pkg.price_one_time_cents
                  ? formatPrice(pkg.price_one_time_cents, pkg.currency)
                  : 'sin pago único'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pkg.status === 'published' ? (
                <ActionButton
                  action={setPackageStatus}
                  fields={{ id: pkg.id, status: 'draft' }}
                  confirm={`¿Retirar "${pkg.title}" del catálogo público? Quien ya lo compró conserva el acceso.`}
                >
                  Despublicar
                </ActionButton>
              ) : (
                <ActionButton
                  action={setPackageStatus}
                  fields={{ id: pkg.id, status: 'published' }}
                  variant="primary"
                >
                  Publicar
                </ActionButton>
              )}
              <ButtonLink href={`/admin/paquetes/${pkg.id}`} variant="secondary" size="sm">
                Editar
              </ButtonLink>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-10 text-center text-sm text-mist-400">
          Todavía no hay paquetes. Crea el primero para empezar a vender.
        </p>
      )}
    </div>
  );
}
