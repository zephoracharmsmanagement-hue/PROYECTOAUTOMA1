import type { ZodError } from 'zod';

/**
 * Estado compartido por todos los formularios del panel.
 * Se consume con `useActionState`, de modo que el resultado de la Server Action
 * se renderiza sin necesidad de estado cliente adicional.
 */
export type FormState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> };

export const IDLE_FORM_STATE: FormState = { status: 'idle' };

export function formError(message: string, fieldErrors?: Record<string, string>): FormState {
  return { status: 'error', message, fieldErrors };
}

export function formSuccess(message: string): FormState {
  return { status: 'success', message };
}

/** Convierte un ZodError en errores por campo listos para pintar. */
export function fromZodError(error: ZodError): FormState {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }

  return formError('Revisa los campos marcados.', fieldErrors);
}

/** Lee un campo de texto opcional, normalizando vacio a null. */
export function optionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Convierte un importe escrito en unidades ("149.90") a centavos enteros. */
export function toCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const amount = Number(value.replace(',', '.'));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

/** Formatea centavos para rellenar un input de importe. */
export function fromCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2);
}
