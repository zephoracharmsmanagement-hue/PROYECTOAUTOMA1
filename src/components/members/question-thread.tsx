'use client';

import { useActionState } from 'react';
import {
  Field,
  FormFeedback,
  Input,
  SubmitButton,
  Textarea,
  fieldError,
} from '@/components/admin/controls';
import { Badge } from '@/components/ui/badge';
import { answerQuestion, askQuestion } from '@/lib/qa/actions';
import { IDLE_FORM_STATE } from '@/lib/admin/form';

export interface ThreadAnswer {
  id: string;
  body: string;
  is_staff: boolean;
  created_at: string;
  authorName: string;
}

export interface Thread {
  id: string;
  title: string;
  body: string;
  status: 'open' | 'answered' | 'hidden';
  created_at: string;
  authorName: string;
  answers: ThreadAnswer[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function AnswerForm({ questionId, packageSlug }: { questionId: string; packageSlug: string }) {
  const [state, formAction] = useActionState(answerQuestion, IDLE_FORM_STATE);

  return (
    <form action={formAction} className="mt-4" key={state.status === 'success' ? 'reset' : 'form'}>
      <input type="hidden" name="question_id" value={questionId} />
      <input type="hidden" name="package_slug" value={packageSlug} />

      <label htmlFor={`answer-${questionId}`} className="sr-only">
        Tu respuesta
      </label>
      <Textarea
        id={`answer-${questionId}`}
        name="body"
        rows={2}
        required
        placeholder="Responde o aporta lo que sepas…"
      />

      <div className="mt-2 flex items-center gap-3">
        <SubmitButton size="sm" pendingLabel="Publicando…">
          Responder
        </SubmitButton>
        <FormFeedback state={state} />
      </div>
    </form>
  );
}

function QuestionCard({ thread, packageSlug }: { thread: Thread; packageSlug: string }) {
  return (
    <article className="card-surface rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{thread.title}</h3>
        {thread.status === 'answered' && (
          <Badge className="border-brand-600 text-brand-400">resuelta</Badge>
        )}
      </div>

      <p className="mt-1 text-xs text-mist-400">
        {thread.authorName} · {formatDate(thread.created_at)}
      </p>

      <p className="mt-3 whitespace-pre-wrap text-sm text-mist-200">{thread.body}</p>

      {thread.answers.length > 0 && (
        <ul className="mt-5 space-y-4 border-t border-ink-800 pt-4">
          {thread.answers.map((answer) => (
            <li
              key={answer.id}
              className={
                answer.is_staff
                  ? 'rounded-xl border border-brand-600/40 bg-brand-500/5 p-4'
                  : 'pl-4 border-l-2 border-ink-700'
              }
            >
              <p className="flex flex-wrap items-center gap-2 text-xs text-mist-400">
                <span className="font-semibold text-mist-200">{answer.authorName}</span>
                {answer.is_staff && (
                  <Badge className="border-brand-600 text-brand-400">equipo</Badge>
                )}
                <span>{formatDate(answer.created_at)}</span>
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-mist-200">{answer.body}</p>
            </li>
          ))}
        </ul>
      )}

      <AnswerForm questionId={thread.id} packageSlug={packageSlug} />
    </article>
  );
}

function AskForm({
  packageId,
  packageSlug,
  lessonId,
}: {
  packageId: string;
  packageSlug: string;
  lessonId?: string;
}) {
  const [state, formAction] = useActionState(askQuestion, IDLE_FORM_STATE);

  return (
    <details className="card-surface rounded-2xl p-5">
      <summary className="cursor-pointer list-none font-semibold text-brand-400 marker:hidden">
        + Hacer una pregunta
      </summary>

      <form
        action={formAction}
        className="mt-4"
        key={state.status === 'success' ? 'reset' : 'form'}
      >
        <input type="hidden" name="package_id" value={packageId} />
        <input type="hidden" name="package_slug" value={packageSlug} />
        {lessonId && <input type="hidden" name="lesson_id" value={lessonId} />}

        <Field label="Resumen" htmlFor="question-title" error={fieldError(state, 'title')}>
          <Input
            id="question-title"
            name="title"
            required
            placeholder="¿Cómo conecto el webhook si mi tienda está en WooCommerce?"
          />
        </Field>

        <Field
          label="Detalle"
          htmlFor="question-body"
          className="mt-4"
          hint="Cuanto más contexto des, mejor será la respuesta."
          error={fieldError(state, 'body')}
        >
          <Textarea id="question-body" name="body" rows={4} required />
        </Field>

        <div className="mt-4 flex items-center gap-3">
          <SubmitButton pendingLabel="Publicando…">Publicar pregunta</SubmitButton>
          <FormFeedback state={state} />
        </div>
      </form>
    </details>
  );
}

/** Hilo de preguntas y respuestas de una lección o de un paquete. */
export function QuestionThread({
  packageId,
  packageSlug,
  lessonId,
  threads,
}: {
  packageId: string;
  packageSlug: string;
  lessonId?: string;
  threads: Thread[];
}) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold tracking-tight">Preguntas de la comunidad</h2>
      <p className="mt-1 text-sm text-mist-400">
        Solo la ven quienes tienen acceso a este paquete. Las respuestas del equipo aparecen
        destacadas.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {threads.map((thread) => (
          <QuestionCard key={thread.id} thread={thread} packageSlug={packageSlug} />
        ))}

        {threads.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink-700 p-6 text-center text-sm text-mist-400">
            Todavía no hay preguntas. Sé el primero.
          </p>
        )}

        <AskForm packageId={packageId} packageSlug={packageSlug} lessonId={lessonId} />
      </div>
    </section>
  );
}
