'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/admin/controls';
import { IDLE_FORM_STATE, type FormState } from '@/lib/admin/form';

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/**
 * Botón que ejecuta una Server Action con un puñado de campos ocultos.
 * Se usa para acciones puntuales (reordenar, publicar, borrar) que no necesitan
 * un formulario completo.
 */
export function ActionButton({
  action,
  fields,
  children,
  confirm,
  variant = 'secondary',
  size = 'sm',
  pendingLabel = '…',
  title,
}: {
  action: Action;
  fields: Record<string, string>;
  children: React.ReactNode;
  confirm?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  pendingLabel?: string;
  title?: string;
}) {
  const [state, formAction] = useActionState(action, IDLE_FORM_STATE);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // Confirmación para operaciones destructivas.
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <span title={title}>
        <SubmitButton variant={variant} size={size} pendingLabel={pendingLabel}>
          {children}
        </SubmitButton>
      </span>

      {state.status === 'error' && (
        <span role="alert" className="text-xs text-red-400">
          {state.message}
        </span>
      )}
    </form>
  );
}
