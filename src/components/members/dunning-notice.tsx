import { BillingPortalButton } from '@/components/members/billing-portal-button';
import type { SubscriptionRow } from '@/types/database.types';

type DunningSubscription = Pick<
  SubscriptionRow,
  'status' | 'dunning_attempts' | 'grace_until' | 'current_period_end'
>;

/**
 * Aviso en la aplicación cuando el cobro de la membresía está fallando.
 *
 * Complementa a los emails: mucha gente no los lee, pero sí entra a la
 * plataforma. Mientras dura el periodo de gracia el acceso sigue intacto, y el
 * mensaje lo dice explícitamente — asustar no acelera el pago, lo convierte en
 * baja.
 */
export function DunningNotice({ subscriptions }: { subscriptions: DunningSubscription[] }) {
  const failing = subscriptions.find((sub) => sub.status === 'past_due' || sub.status === 'unpaid');
  if (!failing) return null;

  const grace = failing.grace_until ?? failing.current_period_end;
  const graceLabel = grace ? new Date(grace).toLocaleDateString('es-ES') : null;

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
      <h2 className="font-semibold text-amber-200">No hemos podido cobrar tu membresía</h2>

      <p className="mt-2 text-sm text-amber-100/90">
        {failing.dunning_attempts > 1
          ? `Llevamos ${failing.dunning_attempts} intentos fallidos. `
          : 'El último cobro no se ha completado. '}
        Suele ser una tarjeta caducada o un límite del banco.
        {graceLabel
          ? ` Tu acceso se mantiene hasta el ${graceLabel}.`
          : ' Tu acceso sigue activo mientras lo resolvemos.'}
      </p>

      <div className="mt-4">
        <BillingPortalButton />
      </div>
    </div>
  );
}
