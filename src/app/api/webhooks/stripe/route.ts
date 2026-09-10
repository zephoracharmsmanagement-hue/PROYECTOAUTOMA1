import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { handleStripeEvent } from '@/lib/stripe/webhook-handlers';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

// Node runtime: la verificacion de firma necesita crypto de Node.
export const runtime = 'nodejs';
// Sin cache ni prerender: cada entrega debe ejecutarse.
export const dynamic = 'force-dynamic';

/**
 * Endpoint del webhook de Stripe.
 *
 * Reglas criticas:
 *  1. Se lee el cuerpo CRUDO (`request.text()`): cualquier parseo previo rompe
 *     la verificacion de firma.
 *  2. Si la firma no valida -> 400 y no se toca la base de datos.
 *  3. Si el manejador falla -> 500 para que Stripe reintente.
 *  4. Errores de negocio ya procesados -> 200, para no entrar en bucle de
 *     reintentos infinitos.
 */
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Falta la cabecera stripe-signature.' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      serverEnv().STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    logger.warn('Firma de webhook inválida', {
      message: error instanceof Error ? error.message : 'desconocido',
    });
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Fallo procesando evento de Stripe', {
      eventId: event.id,
      type: event.type,
      message: error instanceof Error ? error.message : 'desconocido',
    });
    // 500 -> Stripe reintenta con backoff. La idempotencia evita duplicados.
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
