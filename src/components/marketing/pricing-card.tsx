import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/members/checkout-button';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { PlanRow } from '@/types/database.types';

export function PricingCard({
  plan,
  highlighted = false,
  isCurrent = false,
}: {
  plan: PlanRow;
  highlighted?: boolean;
  isCurrent?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl p-8',
        highlighted
          ? 'border-2 border-brand-500 bg-ink-900 shadow-[0_0_60px_-20px_rgba(22,196,127,0.5)]'
          : 'card-surface',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{plan.name}</h3>
        {highlighted && <Badge className="border-brand-600 text-brand-400">Más elegido</Badge>}
      </div>

      {plan.description && <p className="mt-2 text-sm text-mist-400">{plan.description}</p>}

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold">{formatPrice(plan.price_cents, plan.currency)}</span>
        <span className="text-sm text-mist-400">/{plan.interval === 'month' ? 'mes' : 'año'}</span>
      </div>

      {plan.trial_days > 0 && (
        <p className="mt-2 text-sm text-brand-400">{plan.trial_days} días de prueba gratis</p>
      )}

      <ul className="mt-6 flex-1 space-y-3 text-sm text-mist-200">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span aria-hidden className="text-brand-500">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {isCurrent ? (
          <p className="rounded-lg border border-brand-600 px-4 py-3 text-center text-sm text-brand-400">
            Tu plan actual
          </p>
        ) : (
          <CheckoutButton
            intent={{ kind: 'subscription', planSlug: plan.slug }}
            variant={highlighted ? 'primary' : 'secondary'}
            size="lg"
            className="w-full"
          >
            Empezar ahora
          </CheckoutButton>
        )}
      </div>
    </div>
  );
}
