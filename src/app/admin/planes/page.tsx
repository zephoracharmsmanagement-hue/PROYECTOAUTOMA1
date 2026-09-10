import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { PlanForm } from '@/components/admin/plan-form';
import { Badge } from '@/components/ui/badge';
import { togglePlan } from '@/lib/admin/actions/plans';
import { requireAdmin } from '@/lib/admin/guard';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Planes' };

export default async function AdminPlansPage() {
  const { supabase } = await requireAdmin();

  const { data: plans } = await supabase.from('plans').select('*').order('sort_order');
  const list = plans ?? [];

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold">Planes de membresía</h2>
      <p className="mt-1 text-sm text-mist-400">
        Los planes no se borran: desactivarlos los retira de la página de precios sin romper las
        suscripciones existentes.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        {list.map((plan) => (
          <div key={plan.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className={plan.is_active ? 'border-brand-600 text-brand-400' : undefined}>
                {plan.is_active ? 'activo' : 'inactivo'}
              </Badge>
              <span className="text-sm text-mist-400">
                {formatPrice(plan.price_cents, plan.currency)} /
                {plan.interval === 'month' ? 'mes' : 'año'}
              </span>
              <ActionButton
                action={togglePlan}
                fields={{ id: plan.id, is_active: plan.is_active ? 'false' : 'true' }}
                variant="ghost"
              >
                {plan.is_active ? 'Desactivar' : 'Activar'}
              </ActionButton>
            </div>
            <PlanForm plan={plan} />
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Crear plan</h3>
        <div className="mt-4">
          <PlanForm />
        </div>
      </div>
    </div>
  );
}
