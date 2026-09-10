import 'server-only';

import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Envío de email transaccional a través de Resend.
 *
 * Se usa `fetch` contra la API en lugar del SDK: la superficie que necesitamos
 * es un único endpoint, y así el proyecto no arrastra una dependencia más.
 *
 * Nunca lanza. Un fallo de email no puede tumbar el flujo que lo dispara —
 * especialmente el webhook de Stripe, donde un error provocaría reintentos y,
 * con ellos, emails duplicados.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const env = serverEnv();

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    // Sin configurar: se registra el intento y se sigue. Permite desarrollar y
    // desplegar previews sin credenciales de email.
    logger.info('Email omitido: RESEND_API_KEY o EMAIL_FROM sin configurar', {
      to: message.to,
      subject: message.subject,
    });
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(env.EMAIL_REPLY_TO ? { reply_to: env.EMAIL_REPLY_TO } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      logger.error('Resend rechazó el envío', {
        status: response.status,
        detail: detail.slice(0, 300),
        to: message.to,
      });
      return { ok: false, error: `HTTP ${response.status}` };
    }

    logger.info('Email enviado', { to: message.to, subject: message.subject });
    return { ok: true };
  } catch (error) {
    logger.error('Fallo de red enviando email', {
      to: message.to,
      message: error instanceof Error ? error.message : 'desconocido',
    });
    return { ok: false, error: 'network' };
  }
}
