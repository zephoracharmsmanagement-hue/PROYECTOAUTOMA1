import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { siteConfig } from '@/config/site';

export const revalidate = 3600;

interface Certificate {
  code: string;
  issued_at: string;
  holder_name: string;
  package_title: string;
  package_slug: string;
}

/**
 * Verificación pública de un certificado.
 *
 * Lee mediante `verify_certificate()`, una función `security definer` que
 * devuelve solo el nombre del titular, el paquete y la fecha. Ni el email ni el
 * identificador del usuario salen de la base de datos.
 */
async function loadCertificate(code: string): Promise<Certificate | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc('verify_certificate', { p_code: code });

  return (data as unknown as Certificate | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const certificate = await loadCertificate(code);

  if (!certificate) return { title: 'Certificado no encontrado', robots: { index: false } };

  return {
    title: `Certificado de ${certificate.holder_name}`,
    description: `${certificate.holder_name} completó ${certificate.package_title} en ${siteConfig.name}.`,
    alternates: { canonical: `/certificado/${code}` },
  };
}

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const certificate = await loadCertificate(code);

  if (!certificate) notFound();

  const issued = new Date(certificate.issued_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {/* El borde y el fondo se conservan al imprimir o guardar como PDF. */}
      <article className="rounded-3xl border border-brand-600/50 bg-ink-900 p-10 text-center sm:p-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
          Certificado de finalización
        </p>

        <p className="mt-10 text-sm text-mist-400">Se certifica que</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {certificate.holder_name}
        </h1>

        <p className="mt-8 text-sm text-mist-400">ha completado íntegramente el paquete</p>
        <p className="mt-2 text-xl font-semibold text-brand-400 sm:text-2xl">
          {certificate.package_title}
        </p>

        <div className="mt-12 flex flex-col items-center gap-1 text-sm text-mist-400">
          <span>Emitido el {issued}</span>
          <span className="font-mono text-xs">Código de verificación: {certificate.code}</span>
        </div>

        <div className="mt-10 border-t border-ink-700 pt-6 text-sm text-mist-400">
          {siteConfig.name} · {siteConfig.tagline}
        </div>
      </article>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href={`/paquetes/${certificate.package_slug}`} variant="secondary">
          Ver el paquete
        </ButtonLink>
        <Link href="/paquetes" className="text-sm text-mist-400 hover:text-mist-50">
          Explorar el catálogo →
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-mist-400">
        Esta página es la verificación oficial del certificado. Cualquiera con el código puede
        comprobar su autenticidad aquí.
      </p>
    </div>
  );
}
