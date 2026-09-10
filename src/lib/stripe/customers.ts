import 'server-only';

import { getStripe, METADATA_KEYS } from '@/lib/stripe/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Devuelve el `stripe_customer_id` del usuario, creandolo la primera vez.
 *
 * Mantener un unico customer por usuario es lo que permite que una compra de
 * pago unico y una suscripcion convivan bajo la misma ficha de facturacion y
 * que el Billing Portal muestre todo el historial.
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  fullName?: string | null;
}): Promise<string> {
  const admin = createSupabaseAdminClient();

  const { data: profile, error } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', params.userId)
    .single();

  if (error) throw new Error(`No se pudo leer el perfil ${params.userId}: ${error.message}`);
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email: params.email,
    name: params.fullName ?? undefined,
    metadata: { [METADATA_KEYS.userId]: params.userId },
  });

  const { error: updateError } = await admin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', params.userId);

  if (updateError) {
    // El customer ya existe en Stripe; si no logramos persistirlo quedaria
    // huerfano y se crearia otro en el siguiente intento.
    logger.error('No se pudo guardar stripe_customer_id', {
      userId: params.userId,
      customerId: customer.id,
      error: updateError.message,
    });
    throw new Error('No se pudo enlazar el cliente de Stripe con el perfil.');
  }

  return customer.id;
}
