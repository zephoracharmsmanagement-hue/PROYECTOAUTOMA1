import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/, 'Slug inválido');

const bodySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('package'),
    slug,
    // Ids de ofertas marcadas como order bump. El servidor verifica que cada una
    // pertenece a este paquete y sigue activa antes de cobrarla.
    bumpOfferIds: z.array(z.string().uuid()).max(5).optional(),
  }),
  z.object({ kind: z.literal('path'), slug }),
  z.object({ kind: z.literal('upsell'), offerId: z.string().uuid() }),
  z.object({ kind: z.literal('subscription'), planSlug: slug }),
]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Debes iniciar sesión para comprar.' }, { status: 401 });
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: 'Producto solicitado inválido.' }, { status: 400 });
  }

  try {
    const session = await createCheckoutSession(parsed.data, {
      id: user.id,
      email: user.email,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Fallo al crear la sesión de checkout', { userId: user.id, message });

    // Los mensajes de negocio ("ya tienes acceso") son seguros de mostrar;
    // cualquier otro se generaliza para no filtrar detalles de la integración.
    const safe = message.startsWith('Ya tienes') ? message : 'No se pudo iniciar el pago.';
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
