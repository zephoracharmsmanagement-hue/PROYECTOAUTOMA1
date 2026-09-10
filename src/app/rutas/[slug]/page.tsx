import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { CheckoutButton } from '@/components/members/checkout-button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccessPackage, getAccessState } from '@/lib/entitlements';
import { formatPrice } from '@/lib/utils';
import { GUARANTEE_DAYS } from '@/config/site';
import type { PackageRow } from '@/types/database.types';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

type Member = Pick<
  PackageRow,
  | 'id'
  | 'slug'
  | 'title'
  | 'subtitle'
  | 'outcome'
  | 'price_one_time_cents'
  | 'currency'
  | 'included_in_subscription'
> & { note: string | null };

async function loadPath(slug: string) {
  const supabase = await createSupabaseServerClient();

  const { data: path } = await supabase
    .from('paths')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!path) return null;

  const { data: rows } = await supabase
    .from('path_packages')
    .select(
      'note, sort_order, packages(id, slug, title, subtitle, outcome, price_one_time_cents, currency, included_in_subscription)',
    )
    .eq('path_id', path.id)
    .order('sort_order');

  const members: Member[] = (rows ?? [])
    .map((row) => {
      const pkg = row.packages as unknown as Omit<Member, 'note'> | null;
      return pkg ? { ...pkg, note: row.note } : null;
    })
    .filter((member): member is Member => member !== null);

  return { path, members };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadPath(slug);
  if (!data) return { title: 'Ruta no encontrada' };

  const description = data.path.outcome ?? data.path.description ?? undefined;

  return {
    title: data.path.title,
    description,
    alternates: { canonical: `/rutas/${slug}` },
    openGraph: { type: 'article', title: data.path.title, description },
  };
}

export default async function PathDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await loadPath(slug);
  if (!data) notFound();

  const { path, members } = data;
  const access = await getAccessState();

  const ownedFlags = members.map((member) => canAccessPackage(access, member));
  const ownedCount = ownedFlags.filter(Boolean).length;
  const hasAll = members.length > 0 && ownedCount === members.length;

  // El ahorro es el argumento de venta: se calcula, no se afirma.
  const individualTotal = members.reduce(
    (total, member) => total + (member.price_one_time_cents ?? 0),
    0,
  );
  const savings =
    path.price_one_time_cents && individualTotal > path.price_one_time_cents
      ? individualTotal - path.price_one_time_cents
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
        <div>
          <Badge>Ruta de {members.length} paquete(s)</Badge>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight">{path.title}</h1>
          {path.subtitle && <p className="mt-2 text-lg text-brand-400">{path.subtitle}</p>}
          {path.description && <p className="mt-6 text-mist-200">{path.description}</p>}

          <h2 className="mt-12 text-2xl font-bold tracking-tight">El itinerario</h2>

          <ol className="mt-6 space-y-4">
            {members.map((member, index) => (
              <li key={member.id} className="card-surface flex gap-4 rounded-2xl p-5">
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-800 text-sm font-bold text-brand-400"
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/paquetes/${member.slug}`}
                      className="font-semibold hover:text-brand-400"
                    >
                      {member.title}
                    </Link>
                    {ownedFlags[index] && (
                      <Badge className="border-brand-600 text-brand-400">ya lo tienes</Badge>
                    )}
                  </div>

                  {member.subtitle && (
                    <p className="mt-1 text-sm text-brand-400">{member.subtitle}</p>
                  )}
                  {member.note && <p className="mt-2 text-sm text-mist-400">{member.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card-surface rounded-2xl p-6">
            {hasAll ? (
              <>
                <p className="text-lg font-semibold text-brand-400">Tienes la ruta completa</p>
                <ButtonLink href="/dashboard" size="lg" className="mt-6 w-full">
                  Ir a mi biblioteca
                </ButtonLink>
              </>
            ) : (
              <>
                {path.price_one_time_cents ? (
                  <>
                    <p className="text-3xl font-bold">
                      {formatPrice(path.price_one_time_cents, path.currency)}
                    </p>
                    {savings > 0 && (
                      <p className="mt-2 text-sm text-brand-400">
                        Ahorras {formatPrice(savings, path.currency)} frente a comprarlos por
                        separado
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-2xl font-bold">Incluida en la membresía</p>
                )}

                {ownedCount > 0 && (
                  <p className="mt-3 rounded-lg border border-ink-700 p-3 text-xs text-mist-400">
                    Ya tienes {ownedCount} de {members.length} paquetes. El lote tiene precio único,
                    así que quizá te salga mejor comprar solo los que te faltan.
                  </p>
                )}

                {path.price_one_time_cents && path.stripe_price_id_one_time && (
                  <CheckoutButton
                    intent={{ kind: 'path', slug: path.slug }}
                    size="lg"
                    className="mt-6"
                  >
                    Comprar la ruta completa
                  </CheckoutButton>
                )}

                {path.included_in_subscription && (
                  <>
                    <div className="my-5 flex items-center gap-3 text-xs text-mist-400">
                      <span className="h-px flex-1 bg-ink-700" />o
                      <span className="h-px flex-1 bg-ink-700" />
                    </div>
                    <ButtonLink href="/precios" variant="secondary" size="lg" className="w-full">
                      Desbloquear todo con All Access
                    </ButtonLink>
                  </>
                )}

                <p className="mt-5 text-center text-xs text-mist-400">
                  Garantía de {GUARANTEE_DAYS} días. Sin preguntas.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
