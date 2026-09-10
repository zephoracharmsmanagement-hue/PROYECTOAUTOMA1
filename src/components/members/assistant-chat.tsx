'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Citation {
  heading: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

/**
 * Chat del asistente sobre el material del paquete.
 *
 * La respuesta llega por SSE y se pinta mientras se genera: una respuesta con
 * razonamiento puede tardar varios segundos, y un spinner mudo se percibe como
 * que la página se ha colgado.
 */
export function AssistantChat({
  packageId,
  packageTitle,
  enabled,
}: {
  packageId: string;
  packageTitle: string;
  enabled: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streaming]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = input.trim();
    if (question.length < 3 || streaming) return;

    setInput('');
    setError(null);
    setStreaming(true);
    setMessages((current) => [
      ...current,
      { role: 'user', content: question },
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          packageId,
          conversationId: conversationId.current ?? undefined,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? 'No se pudo contactar con el asistente.');
        setMessages((current) => current.slice(0, -1));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // El flujo llega en trozos arbitrarios: se acumulan hasta tener eventos
      // completos, separados por línea en blanco.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith('data:')) continue;

          const payload = JSON.parse(line.slice(5).trim()) as {
            type: string;
            value?: string;
            message?: string;
            conversationId?: string;
            citations?: Citation[];
          };

          if (payload.type === 'start') {
            conversationId.current = payload.conversationId ?? null;
            setMessages((current) => {
              const next = [...current];
              const last = next[next.length - 1];
              if (last) last.citations = payload.citations ?? [];
              return next;
            });
          }

          if (payload.type === 'text' && payload.value) {
            setMessages((current) => {
              const next = [...current];
              const last = next[next.length - 1];
              if (last) last.content += payload.value;
              return next;
            });
          }

          if (payload.type === 'error') {
            setError(payload.message ?? 'Fallo generando la respuesta.');
          }
        }
      }
    } catch {
      setError('Fallo de conexión con el asistente.');
      setMessages((current) => current.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  if (!enabled) {
    return (
      <div className="card-surface rounded-2xl p-8 text-center">
        <p className="text-mist-400">
          El asistente no está disponible ahora mismo. Vuelve a intentarlo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="card-surface min-h-[24rem] rounded-2xl p-6">
        {messages.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-mist-400">
              Pregunta lo que quieras sobre <strong className="text-mist-50">{packageTitle}</strong>
              .
            </p>
            <p className="mt-3 text-sm text-mist-400">
              Responde solo con el material del paquete y te dice de qué lección sale cada cosa.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-5">
            {messages.map((message, index) => (
              <li
                key={index}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-ink-800 px-4 py-3'
                    : 'max-w-[95%]'
                }
              >
                {message.role === 'assistant' && (
                  <p className="mb-2 text-xs font-semibold text-brand-400">Asistente</p>
                )}

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-mist-200">
                  {message.content}
                  {streaming && index === messages.length - 1 && message.role === 'assistant' && (
                    <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-brand-500 align-middle" />
                  )}
                </p>

                {message.role === 'assistant' &&
                  message.citations &&
                  message.citations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.citations.slice(0, 4).map((citation) => (
                        <Badge key={citation.heading}>{citation.heading}</Badge>
                      ))}
                    </div>
                  )}
              </li>
            ))}
          </ul>
        )}

        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="assistant-input" className="sr-only">
          Tu pregunta
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={streaming}
          placeholder="¿Cómo conecto el webhook con mi tienda?"
          className="h-11 flex-1 rounded-lg border border-ink-600 bg-ink-950 px-4 text-sm outline-none placeholder:text-mist-400 focus:border-brand-500 disabled:opacity-60"
        />
        <Button type="submit" disabled={streaming || input.trim().length < 3}>
          {streaming ? 'Pensando…' : 'Preguntar'}
        </Button>
      </form>

      <p className="mt-3 text-xs text-mist-400">
        El asistente puede equivocarse. Contrasta siempre con la lección que cita antes de aplicar
        algo en tu tienda.
      </p>
    </div>
  );
}
