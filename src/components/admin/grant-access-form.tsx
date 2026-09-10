'use client';

import { useActionState } from 'react';
import {
  Checkbox,
  Field,
  FormFeedback,
  Input,
  Select,
  SubmitButton,
} from '@/components/admin/controls';
import { grantAccess } from '@/lib/admin/actions/entitlements';
import { IDLE_FORM_STATE } from '@/lib/admin/form';

/**
 * Concesión manual de acceso. Casos reales: recuperar una compra cuyo webhook
 * falló, regalar un paquete, o dar acceso a un afiliado.
 */
export function GrantAccessForm({ packages }: { packages: Array<{ id: string; title: string }> }) {
  const [state, formAction] = useActionState(grantAccess, IDLE_FORM_STATE);

  return (
    <form action={formAction} className="card-surface rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Conceder acceso manualmente</h2>
      <p className="mt-1 text-sm text-mist-400">
        El usuario debe tener ya una cuenta creada. La concesión queda marcada como manual para
        distinguirla de una compra.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Email del usuario" htmlFor="grant-email">
          <Input
            id="grant-email"
            name="email"
            type="email"
            required
            placeholder="cliente@email.com"
          />
        </Field>

        <Field label="Qué desbloquear" htmlFor="grant-target">
          <Select id="grant-target" name="target" defaultValue="all_access">
            <option value="all_access">Membresía All Access</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.title}
              </option>
            ))}
          </Select>
        </Field>

        <SubmitButton pendingLabel="Concediendo…">Conceder</SubmitButton>
      </div>

      <div className="mt-4">
        <Checkbox
          name="notify"
          label="Avisar por email al usuario"
          hint="Si el envío falla, el acceso se concede igualmente."
          defaultChecked
        />
      </div>

      <div className="mt-4">
        <FormFeedback state={state} />
      </div>
    </form>
  );
}
