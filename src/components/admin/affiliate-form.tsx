'use client';

import { useActionState } from 'react';
import {
  Checkbox,
  Field,
  FormFeedback,
  Input,
  SubmitButton,
  Textarea,
  fieldError,
} from '@/components/admin/controls';
import { saveAffiliate } from '@/lib/admin/actions/affiliates';
import { IDLE_FORM_STATE } from '@/lib/admin/form';
import type { AffiliateRow } from '@/types/database.types';

export function AffiliateForm({ affiliate, email }: { affiliate?: AffiliateRow; email?: string }) {
  const isEdit = Boolean(affiliate);
  const [state, formAction] = useActionState(saveAffiliate, IDLE_FORM_STATE);

  const suffix = affiliate?.id ?? 'new';

  return (
    <form
      action={formAction}
      className="card-surface rounded-2xl p-6"
      key={!isEdit && state.status === 'success' ? 'reset' : 'form'}
    >
      {affiliate && <input type="hidden" name="id" value={affiliate.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Email de la cuenta"
          htmlFor={`email-${suffix}`}
          hint="Debe tener cuenta creada en la plataforma."
          error={fieldError(state, 'email')}
        >
          <Input
            id={`email-${suffix}`}
            name="email"
            type="email"
            required
            defaultValue={email ?? ''}
            readOnly={isEdit}
          />
        </Field>

        <Field
          label="Código de referido"
          htmlFor={`code-${suffix}`}
          hint="Se usa como ?ref=CODIGO en los enlaces."
          error={fieldError(state, 'code')}
        >
          <Input id={`code-${suffix}`} name="code" required defaultValue={affiliate?.code ?? ''} />
        </Field>

        <Field
          label="Comisión (%)"
          htmlFor={`pct-${suffix}`}
          error={fieldError(state, 'commission_pct')}
        >
          <Input
            id={`pct-${suffix}`}
            name="commission_pct"
            type="number"
            min="0"
            max="100"
            step="0.5"
            defaultValue={affiliate?.commission_pct ?? 30}
          />
        </Field>

        <div className="flex items-end">
          <Checkbox
            name="is_active"
            label="Afiliado activo"
            hint="Inactivo, sus enlaces dejan de generar comisión."
            defaultChecked={affiliate?.is_active ?? true}
          />
        </div>

        <Field
          label="Datos de pago"
          htmlFor={`payout-${suffix}`}
          className="sm:col-span-2"
          hint="Texto libre: IBAN, PayPal, Wise. El pago se hace fuera de la plataforma."
        >
          <Textarea
            id={`payout-${suffix}`}
            name="payout_details"
            rows={2}
            defaultValue={affiliate?.payout_details ?? ''}
          />
        </Field>

        <Field label="Notas internas" htmlFor={`notes-${suffix}`} className="sm:col-span-2">
          <Textarea
            id={`notes-${suffix}`}
            name="notes"
            rows={2}
            defaultValue={affiliate?.notes ?? ''}
          />
        </Field>
      </div>

      <div className="mt-5">
        <FormFeedback state={state} />
      </div>

      <div className="mt-5">
        <SubmitButton>{isEdit ? 'Guardar afiliado' : 'Dar de alta'}</SubmitButton>
      </div>
    </form>
  );
}
