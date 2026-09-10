import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { serverEnv } from '@/lib/env';

let cached: Anthropic | null = null;

/** ¿Está el asistente configurado? La interfaz lo consulta antes de ofrecerlo. */
export function isAssistantEnabled(): boolean {
  return Boolean(serverEnv().ANTHROPIC_API_KEY);
}

export function getAnthropic(): Anthropic {
  if (cached) return cached;

  const apiKey = serverEnv().ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('El asistente no está configurado: falta ANTHROPIC_API_KEY.');

  cached = new Anthropic({ apiKey });
  return cached;
}

/**
 * Configuración del modelo.
 *
 * `effort: 'low'` por defecto: las respuestas ya vienen ancladas en fragmentos
 * recuperados del propio material, así que el trabajo del modelo es explicar lo
 * que tiene delante, no razonar desde cero. Subirlo es un cambio de variable de
 * entorno si en la práctica se queda corto.
 *
 * El razonamiento se deja en adaptativo (el modo por defecto en Opus 5).
 * Desactivarlo tiene dos fallos conocidos —fugas de etiquetas internas en la
 * respuesta visible y llamadas a herramienta escritas como texto— y bajar el
 * esfuerzo consigue el mismo ahorro sin ellos.
 */
export function getModelConfig() {
  const env = serverEnv();

  return {
    model: env.ASSISTANT_MODEL,
    effort: env.ASSISTANT_EFFORT,
    // Tope de seguridad, no objetivo. Con razonamiento adaptativo los tokens de
    // pensamiento cuentan aquí, así que dejarlo justo truncaría respuestas.
    maxTokens: 8000,
  };
}
