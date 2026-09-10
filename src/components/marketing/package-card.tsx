import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import type { PackageRow } from '@/types/database.types';

type CardPackage = Pick<
  PackageRow,
  | 'slug'
  | 'title'
  | 'subtitle'
  | 'outcome'
  | 'category'
  | 'level'
  | 'price_one_time_cents'
  | 'compare_at_price_cents'
  | 'currency'
>;

export function PackageCard({ pkg, owned = false }: { pkg: CardPackage; owned?: boolean }) {
  return (
    <Link
      href={`/paquetes/${pkg.slug}`}
      className="card-surface group flex flex-col rounded-2xl p-6 transition-colors"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{pkg.category}</Badge>
        <Badge>{pkg.level}</Badge>
        {owned && <Badge className="border-brand-600 text-brand-400">Ya lo tienes</Badge>}
      </div>

      <h3 className="mt-4 text-xl font-bold leading-snug group-hover:text-brand-400">
        {pkg.title}
      </h3>
      {pkg.subtitle && <p className="mt-1 text-sm text-brand-400">{pkg.subtitle}</p>}
      {pkg.outcome && <p className="mt-3 flex-1 text-sm text-mist-400">{pkg.outcome}</p>}

      <div className="mt-6 flex items-baseline gap-2">
        {owned ? (
          <span className="text-lg font-semibold text-brand-400">Acceso activo</span>
        ) : pkg.price_one_time_cents ? (
          <>
            <span className="text-2xl font-bold">
              {formatPrice(pkg.price_one_time_cents, pkg.currency)}
            </span>
            {pkg.compare_at_price_cents ? (
              <span className="text-sm text-mist-400 line-through">
                {formatPrice(pkg.compare_at_price_cents, pkg.currency)}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-lg font-semibold">Incluido en la membresía</span>
        )}
      </div>
    </Link>
  );
}
