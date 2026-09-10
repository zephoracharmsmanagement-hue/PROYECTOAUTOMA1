import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AssistantChat } from '@/components/members/assistant-chat';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccessPackage, getAccessState } from '@/lib/entitlements';
import { isAssistantEnabled } from '@/lib/assistant/client';

export const metadata: Metadata = { title: 'Asistente', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AssistantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: pkg } = await supabase
    .from('packages')
    .select('id, slug, title, included_in_subscription')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!pkg) notFound();

  const access = await getAccessState();
  if (!access.userId) redirect(`/login?next=/biblioteca/${slug}/asistente`);
  if (!canAccessPackage(access, pkg)) redirect(`/paquetes/${slug}`);

  // Sin material indexado el asistente no puede responder nada: mejor decirlo
  // que dejar que el alumno descubra a base de respuestas vacías.
  const { count } = await supabase
    .from('content_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('package_id', pkg.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href={`/biblioteca/${pkg.slug}`} className="text-sm text-mist-400 hover:text-mist-50">
        ← {pkg.title}
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">Asistente del paquete</h1>
      <p className="mt-2 text-mist-400">
        Resuelve dudas sobre lo que estás implementando, con el material de este paquete como única
        fuente.
      </p>

      {(count ?? 0) === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          Este paquete todavía no tiene material indexado, así que el asistente no podría responder.
          Estará disponible en cuanto se publiquen las transcripciones.
        </p>
      ) : (
        <div className="mt-8">
          <AssistantChat
            packageId={pkg.id}
            packageTitle={pkg.title}
            enabled={isAssistantEnabled()}
          />
        </div>
      )}
    </div>
  );
}
