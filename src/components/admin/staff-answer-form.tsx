'use client';

import { useActionState } from 'react';
import { FormFeedback, SubmitButton, Textarea } from '@/components/admin/controls';
import { answerQuestion } from '@/lib/qa/actions';
import { IDLE_FORM_STATE } from '@/lib/admin/form';

/**
 * Respuesta oficial del equipo.
 *
 * El campo `as_staff` va fijo: la política de inserción solo lo acepta si quien
 * escribe es admin, así que no es la interfaz quien concede el distintivo.
 */
export function StaffAnswerForm({ questionId }: { questionId: string }) {
  const [state, formAction] = useActionState(answerQuestion, IDLE_FORM_STATE);

  return (
    <form action={formAction} className="mt-4" key={state.status === 'success' ? 'reset' : 'form'}>
      <input type="hidden" name="question_id" value={questionId} />
      <input type="hidden" name="as_staff" value="on" />

      <label htmlFor={`staff-answer-${questionId}`} className="sr-only">
        Responder como equipo
      </label>
      <Textarea
        id={`staff-answer-${questionId}`}
        name="body"
        rows={3}
        required
        placeholder="Responder como equipo…"
      />

      <div className="mt-2 flex items-center gap-3">
        <SubmitButton size="sm" pendingLabel="Publicando…">
          Responder como equipo
        </SubmitButton>
        <FormFeedback state={state} />
      </div>
    </form>
  );
}
