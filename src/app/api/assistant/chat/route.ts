import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAnthropic, getModelConfig, isAssistantEnabled } from '@/lib/assistant/client';
import { getRetriever } from '@/lib/assistant/retriever';
import { SYSTEM_PROMPT, buildContextMessage, citationsFrom } from '@/lib/assistant/prompt';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Una respuesta con razonamiento adaptativo puede tardar más que el timeout por
// defecto de la plataforma.
export const maxDuration = 60;

const bodySchema = z.object({
  question: z.string().min(3, 'Escribe una pregunta.').max(2000),
  packageId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
});

/** Turnos previos que se reenvían. Más historia es más coste por cada mensaje. */
const HISTORY_TURNS = 8;

function sse(payload: Record<string, unknown>): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!isAssistantEnabled()) {
    return errorResponse('El asistente no está disponible en este momento.', 503);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return errorResponse('Inicia sesión para usar el asistente.', 401);

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return errorResponse('Petición inválida.', 400);
  }

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Petición inválida.', 400);
  }

  const { question, packageId, conversationId } = parsed.data;

  // -------------------------------------------------------------- límite diario
  // Cada mensaje cuesta dinero real: sin tope, una sola cuenta puede generar una
  // factura desagradable en una tarde.
  const { data: usedToday } = await supabase.rpc('assistant_messages_today');
  const limit = serverEnv().ASSISTANT_DAILY_MESSAGE_LIMIT;

  if ((usedToday ?? 0) >= limit) {
    return errorResponse(
      `Has alcanzado el límite de ${limit} preguntas al día. Vuelve mañana.`,
      429,
    );
  }

  // ------------------------------------------------------------------ contexto
  const chunks = await getRetriever().retrieve(question, { packageId, limit: 8 });
  const citations = citationsFrom(chunks);

  // -------------------------------------------------------------- conversación
  const admin = createSupabaseAdminClient();
  let activeConversationId = conversationId ?? null;

  if (activeConversationId) {
    // Se verifica la propiedad antes de escribir en ella: el id viaja desde el
    // cliente y podría apuntar a la conversación de otra persona.
    const { data: owned } = await supabase
      .from('assistant_conversations')
      .select('id')
      .eq('id', activeConversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!owned) activeConversationId = null;
  }

  if (!activeConversationId) {
    const { data: created, error } = await admin
      .from('assistant_conversations')
      .insert({
        user_id: user.id,
        package_id: packageId ?? null,
        title: question.slice(0, 80),
      })
      .select('id')
      .single();

    if (error || !created) {
      logger.error('No se pudo crear la conversación del asistente', { message: error?.message });
      return errorResponse('No se pudo iniciar la conversación.', 500);
    }

    activeConversationId = created.id;
  }

  const { data: history } = await supabase
    .from('assistant_messages')
    .select('role, content')
    .eq('conversation_id', activeConversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_TURNS * 2);

  const priorTurns = (history ?? [])
    .slice()
    .reverse()
    .map((message) => ({ role: message.role, content: message.content }));

  await admin.from('assistant_messages').insert({
    conversation_id: activeConversationId,
    role: 'user',
    content: question,
  });

  // --------------------------------------------------------------- generación
  const { model, effort, maxTokens } = getModelConfig();
  const conversationIdForStream = activeConversationId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let answer = '';
      let inputTokens = 0;
      let outputTokens = 0;

      const send = (payload: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(sse(payload)));

      try {
        send({ type: 'start', conversationId: conversationIdForStream, citations });

        const messageStream = getAnthropic().beta.messages.stream({
          model,
          max_tokens: maxTokens,
          // Fallback de servidor: si el modelo declina la petición por política,
          // la API la reintenta sola en un modelo de respaldo dentro de la misma
          // llamada, en lugar de dejar al alumno sin respuesta.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          // El prompt de sistema es estable byte a byte, así que sirve de prefijo
          // cacheable; lo que cambia por pregunta va en el mensaje de usuario.
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          thinking: { type: 'adaptive' },
          output_config: { effort },
          messages: [
            ...priorTurns,
            { role: 'user', content: buildContextMessage(question, chunks) },
          ],
        });

        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            answer += event.delta.text;
            send({ type: 'text', value: event.delta.text });
          }
        }

        const final = await messageStream.finalMessage();

        inputTokens = final.usage.input_tokens;
        outputTokens = final.usage.output_tokens;

        // Un rechazo por seguridad llega como respuesta correcta (HTTP 200), no
        // como excepción: hay que mirar `stop_reason` antes de dar por buena la
        // respuesta.
        if (final.stop_reason === 'refusal') {
          answer =
            'No puedo responder a esa pregunta. Prueba a reformularla centrándote en el material del paquete.';
          send({ type: 'text', value: answer });
        }

        logger.info('Respuesta del asistente generada', {
          userId: user.id,
          model,
          inputTokens,
          outputTokens,
          cachedTokens: final.usage.cache_read_input_tokens ?? 0,
          chunks: chunks.length,
        });

        send({ type: 'done' });
      } catch (error) {
        logger.error('Fallo generando la respuesta del asistente', {
          userId: user.id,
          message: error instanceof Error ? error.message : 'desconocido',
        });
        send({ type: 'error', message: 'No se pudo generar la respuesta. Inténtalo de nuevo.' });
      } finally {
        // La respuesta se guarda aunque el alumno cierre la pestaña a medias:
        // el consumo ya se ha producido y debe quedar registrado.
        if (answer.length > 0) {
          await admin.from('assistant_messages').insert({
            conversation_id: conversationIdForStream,
            role: 'assistant',
            content: answer,
            citations: citations.map((citation) => ({ heading: citation.heading })),
            input_tokens: inputTokens,
            output_tokens: outputTokens,
          });
        }

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
