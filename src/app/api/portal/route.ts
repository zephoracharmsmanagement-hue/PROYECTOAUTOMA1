import { NextResponse } from 'next/server';
import { createBillingPortalSession } from '@/lib/stripe/checkout';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Abre el Billing Portal de Stripe para gestionar método de pago y cancelación. */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Todavía no tienes compras registradas.' }, { status: 400 });
  }

  try {
    const session = await createBillingPortalSession(profile.stripe_customer_id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error('Fallo al abrir el Billing Portal', {
      userId: user.id,
      message: error instanceof Error ? error.message : 'desconocido',
    });
    return NextResponse.json(
      { error: 'No se pudo abrir el portal de facturación.' },
      { status: 500 },
    );
  }
}
