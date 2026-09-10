import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { VideoPlayer } from '@/components/members/video-player';
import { MarkCompleteButton } from '@/components/members/mark-complete-button';
import { QuestionThread, type Thread } from '@/components/members/question-thread';
import { AutomationList, type AutomationItem } from '@/components/members/automation-list';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessState, canAccessPackage } from '@/lib/entitlements';

export const metadata: Metadata = { title: 'Lección' };
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { slug, lessonSlug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: pkg } = await supabase
    .from('packages')
    .select('id, slug, title, included_in_subscription')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!pkg) notFound();

  const access = await getAccessState();
  if (!access.userId) redirect(`/login?next=/biblioteca/${slug}/${lessonSlug}`);
  if (!canAccessPackage(access, pkg)) redirect(`/paquetes/${slug}`);

  // El temario ordenado sirve para resolver la lección y calcular anterior/siguiente.
  const { data: outline } = await supabase
    .from('lesson_outline')
    .select('*')
    .eq('package_id', pkg.id)
    .order('sort_order');

  const lessons = outline ?? [];
  const index = lessons.findIndex((item) => item.slug === lessonSlug);
  const lesson = index >= 0 ? lessons[index] : undefined;

  if (!lesson) notFound();

  const previous = index > 0 ? lessons[index - 1] : undefined;
  const next = index < lessons.length - 1 ? lessons[index + 1] : undefined;

  const [{ data: detail }, { data: progress }, { data: thread }] = await Promise.all([
    supabase.from('lessons').select('description, resources').eq('id', lesson.id).maybeSingle(),
    supabase
      .from('lesson_progress')
      .select('completed_at')
      .eq('user_id', access.userId)
      .eq('lesson_id', lesson.id)
      .maybeSingle(),
    // La función revalida el acceso y devuelve los nombres visibles, que RLS
    // sobre `profiles` no dejaría leer de otro modo.
    supabase.rpc('package_thread', { p_package_id: pkg.id, p_lesson_id: lesson.id }),
  ]);

  const { data: automations } = await supabase
    .from('automations')
    .select('id, name, description, platform, version, setup_notes, requires')
    .eq('lesson_id', lesson.id)
    .eq('status', 'published')
    .order('sort_order');

  const resources = detail?.resources ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href={`/biblioteca/${pkg.slug}`} className="text-sm text-mist-400 hover:text-mist-50">
        ← {pkg.title}
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>

      <div className="mt-6">
        <VideoPlayer lessonId={lesson.id} title={lesson.title} />
      </div>

      {detail?.description && <p className="mt-6 text-mist-200">{detail.description}</p>}

      {resources.length > 0 && (
        <section className="card-surface mt-8 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Recursos de esta lección</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {resources.map((resource) => (
              <li key={resource.url}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:underline"
                >
                  {resource.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <MarkCompleteButton
          lessonId={lesson.id}
          packageId={pkg.id}
          packageSlug={pkg.slug}
          initiallyCompleted={Boolean(progress?.completed_at)}
        />
      </div>

      <AutomationList
        automations={(automations ?? []) as AutomationItem[]}
        title="Automatizaciones de esta lección"
      />

      <QuestionThread
        packageId={pkg.id}
        packageSlug={pkg.slug}
        lessonId={lesson.id}
        threads={(thread ?? []) as unknown as Thread[]}
      />

      <nav className="mt-10 flex items-center justify-between gap-4 border-t border-ink-800 pt-6 text-sm">
        {previous ? (
          <Link href={`/biblioteca/${pkg.slug}/${previous.slug}`} className="hover:text-brand-400">
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/biblioteca/${pkg.slug}/${next.slug}`}
            className="text-right hover:text-brand-400"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
