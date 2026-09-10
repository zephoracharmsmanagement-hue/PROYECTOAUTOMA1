'use client';

import { useFormStatus } from 'react-dom';
import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FormState } from '@/lib/admin/form';

const inputBase =
  'w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-mist-50 outline-none ' +
  'placeholder:text-mist-400 focus:border-brand-500 disabled:opacity-60';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-mist-200">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-mist-400">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(inputBase, 'min-h-24 resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select className={cn(inputBase, className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  hint,
  ...props
}: ComponentProps<'input'> & { label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-700 bg-ink-950 p-3">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-[var(--color-brand-500)]"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium text-mist-200">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-mist-400">{hint}</span>}
      </span>
    </label>
  );
}

/** Botón de envío que se deshabilita solo mientras la acción está en vuelo. */
export function SubmitButton({
  children,
  pendingLabel = 'Guardando…',
  variant = 'primary',
  size = 'md',
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} variant={variant} size={size} className={className}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

/** Resultado de la última ejecución de la acción. */
export function FormFeedback({ state }: { state: FormState }) {
  if (state.status === 'idle') return null;

  const isError = state.status === 'error';

  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        isError
          ? 'border-red-500/40 bg-red-500/10 text-red-300'
          : 'border-brand-600/50 bg-brand-500/10 text-brand-400',
      )}
    >
      {state.message}
    </p>
  );
}

/** Acceso rápido a los errores por campo del estado del formulario. */
export function fieldError(state: FormState, name: string): string | undefined {
  return state.status === 'error' ? state.fieldErrors?.[name] : undefined;
}
