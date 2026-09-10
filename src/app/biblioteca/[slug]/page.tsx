import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessState, canAccessPackage } from '@/lib/entitlements';
import { formatDuration } from '@/lib/utils';

export const metadata: Metadata = { title: 'Contenido del paquete' };
export const dynamic = 'force-dynamic';

export default async function LibraryPackagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: pkg } = await supabase
    .from('packages')
    .select('id, slug, title, subtitle, included_in_subscription')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!pkg) notFound();

  const access = await getAccessState();
  if (!access.userId) redirect(`/login?next=/biblioteca/${slug}`);

  // Sin acceso se devuelve a la ficha de venta en lugar de mostrar un 403 seco.
  if (!canAccessPackage(access, pkg)) redirect(`/paquetes/${slug}`);

  const [{ data: modules }, { data: outline }, { data: progress }, { data: certificate }] =
    await Promise.all([
      supabase.from('modules').select('*').eq('package_id', pkg.id).order('sort_order'),
      supabase.from('lesson_outline').select('*').eq('package_id', pkg.id).order('sort_order'),
      supabase
        .from('lesson_progress')
        .select('lesson_id, completed_at')
        .eq('user_id', access.userId),
      supabase
        .from('certificates')
        .select('code')
        .eq('user_id', access.userId)
        .eq('package_id', pkg.id)
        .maybeSingle(),
    ]);

  const completed = new Set(
    (progress ?? []).filter((row) => row.completed_at).map((row) => row.lesson_id),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/dashboard" className="text-sm text-mist-400 hover:text-mist-50">
        ← Volver a mi biblioteca
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">{pkg.title}</h1>
      {pkg.subtitle && <p className="mt-2 text-brand-400">{pkg.subtitle}</p>}

      {certificate && (
        <Link
          href={`/certificado/${certificate.code}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-brand-600/60 bg-brand-500/5 px-4 py-3 text-sm font-semibold text-brand-400"
        >
          🏅 Paquete completado — ver tu certificado →
        </Link>
      )}

      <div className="mt-10 space-y-6">
        {(modules ?? []).map((module) => {
          const lessons = (outline ?? []).filter((lesson) => lesson.module_id === module.id);

          return (
            <div key={module.id} className="card-surface rounded-2xl p-6">
              <h2 className="text-lg font-semibold">{module.title}</h2>
              {module.summary && <p className="mt-1 text-sm text-mist-400">{module.summary}</p>}

              <ul className="mt-4 divide-y divide-ink-800 border-t border-ink-800">
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/biblioteca/${pkg.slug}/${lesson.slug}`}
                      className="flex items-center justify-between gap-4 py-3 text-sm hover:text-brand-400"
                    >
                      <span className="flex items-center gap-2">
                        {completed.has(lesson.id) && (
                          <span aria-label="Completada" className="text-brand-500">
                            ✓
                          </span>
                        )}
                        {lesson.title}
                        {lesson.is_preview && <Badge>Gratis</Badge>}
                      </span>
                      <span className="shrink-0 text-mist-400">
                        {formatDuration(lesson.duration_seconds)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
