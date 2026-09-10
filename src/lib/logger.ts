/**
 * Logger minimo con salida estructurada (JSON en produccion) y redaccion de
 * campos sensibles. Suficiente para Vercel/Netlify sin arrastrar dependencias.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const REDACTED_KEYS = /(secret|token|key|password|authorization|signature)/i;

function redact(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      REDACTED_KEYS.test(k) ? '[redacted]' : redact(v),
    ]),
  );
}

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context: redact(context) } : {}),
  };

  const line =
    process.env.NODE_ENV === 'production' ? JSON.stringify(entry) : `[${level}] ${message}`;

  if (level === 'error')
    console.error(line, process.env.NODE_ENV === 'production' ? '' : (context ?? ''));
  else if (level === 'warn')
    console.warn(line, process.env.NODE_ENV === 'production' ? '' : (context ?? ''));
  else console.log(line, process.env.NODE_ENV === 'production' ? '' : (context ?? ''));
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', m, c);
  },
  info: (m: string, c?: Record<string, unknown>) => emit('info', m, c),
  warn: (m: string, c?: Record<string, unknown>) => emit('warn', m, c),
  error: (m: string, c?: Record<string, unknown>) => emit('error', m, c),
};
