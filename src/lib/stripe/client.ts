import 'server-only';

import Stripe from 'stripe';
import { serverEnv } from '@/lib/env';

let cached: Stripe | null = null;

/** Instancia unica de Stripe para el servidor. */
export function getStripe(): Stripe {
  if (cached) return cached;
  cached = new Stripe(serverEnv().STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
    appInfo: { name: 'Automa SaaS Ecommerce', version: '0.1.0' },
  });
  return cached;
}

/**
 * Claves de metadata que viajan en cada sesion de checkout.
 * El webhook depende de ellas para conceder el entitlement correcto, asi que
 * se centralizan aqui para evitar strings sueltos que se desincronicen.
 */
export const METADATA_KEYS = {
  userId: 'automa_user_id',
  /** Lista separada por comas: un checkout puede llevar varios paquetes (bumps). */
  packageIds: 'automa_package_ids',
  /** Clave heredada, de una sola compra. Se sigue leyendo por compatibilidad. */
  packageId: 'automa_package_id',
  planId: 'automa_plan_id',
  kind: 'automa_kind',
  /** Afiliado al que se atribuye la venta, si lo hay. */
  affiliateId: 'automa_affiliate_id',
} as const;
