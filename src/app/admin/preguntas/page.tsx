import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { StaffAnswerForm } from '@/components/admin/staff-answer-form';
import { Badge } from '@/components/ui/badge';
import { setQuestionStatus } from '@/lib/admin/actions/questions';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = { title: 'Preguntas' };

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase
    .from('questions')
    .select('*, profiles(email), packages(title, slug), answers(id, body, is_staff, created_at)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (estado === 'open' || estado === 'answered' || estado === 'hidden') {
    query = query.eq('status', estado);
  }

  const { data: questions } = await query;
  const list = questions ?? [];

  const filters = [
    { key: '', label: 'Todas' },
    { key: 'open', label: 'Sin responder' },
    { key: 'answered', label: 'Resueltas' },
    { key: 'hidden', label: 'Ocultas' },
  ];

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold">Preguntas de miembros</h2>
      <p className="mt-1 text-sm text-mist-400">
        Responder como equipo destaca la respuesta y marca la pregunta como resuelta.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <a
            key={filter.key}
            href={filter.key ? `/admin/preguntas?estado=${filter.key}` : '/admin/preguntas'}
            className={
              (estado ?? '') === filter.key
                ? 'rounded-lg border border-brand-600 px-3 py-1.5 text-sm text-brand-400'
                : 'rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-mist-400 hover:text-mist-50'
            }
          >
            {filter.label}
          </a>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {list.map((question) => {
          const answers = (question.answers ?? []) as Array<{
            id: string;
            body: string;
            is_staff: boolean;
            created_at: string;
          }>;

          return (
            <article key={question.id} className="card-surface rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    question.status === 'answered' ? 'border-brand-600 text-brand-400' : undefined
                  }
                >
                  {question.status}
                </Badge>
                <span className="text-xs text-mist-400">
                  {(question.packages as { title: string } | null)?.title ?? '—'}
                </span>
                <span className="text-xs text-mist-400">
                  {(question.profiles as { email: string } | null)?.email ?? '—'}
                </span>
                <span className="text-xs text-mist-400">
                  {new Date(question.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>

              <h3 className="mt-3 font-semibold">{question.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-mist-200">{question.body}</p>

              {answers.length > 0 && (
                <ul className="mt-4 space-y-3 border-t border-ink-800 pt-4 text-sm">
                  {answers.map((answer) => (
                    <li key={answer.id} className="border-l-2 border-ink-700 pl-3">
                      {answer.is_staff && (
                        <Badge className="border-brand-600 text-brand-400">equipo</Badge>
                      )}
                      <p className="mt-1 whitespace-pre-wrap text-mist-200">{answer.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              <StaffAnswerForm questionId={question.id} />

              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-800 pt-4">
                {question.status !== 'answered' && (
                  <ActionButton
                    action={setQuestionStatus}
                    fields={{ id: question.id, status: 'answered' }}
                  >
                    Marcar resuelta
                  </ActionButton>
                )}
                {question.status !== 'open' && (
                  <ActionButton
                    action={setQuestionStatus}
                    fields={{ id: question.id, status: 'open' }}
                  >
                    Reabrir
                  </ActionButton>
                )}
                {question.status !== 'hidden' && (
                  <ActionButton
                    action={setQuestionStatus}
                    fields={{ id: question.id, status: 'hidden' }}
                    confirm="¿Ocultar esta pregunta? Dejará de verla el resto de miembros; su autor seguirá viéndola."
                    variant="ghost"
                  >
                    Ocultar
                  </ActionButton>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          No hay preguntas con ese filtro.
        </p>
      )}
    </div>
  );
}
