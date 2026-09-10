import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s | Panel' },
  // El panel nunca debe aparecer en buscadores.
  robots: { index: false, follow: false },
};

// Ningún dato del panel puede cachearse: refleja el estado real en cada carga.
export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/metricas', label: 'Métricas' },
  { href: '/admin/paquetes', label: 'Paquetes' },
  { href: '/admin/planes', label: 'Planes' },
  { href: '/admin/testimonios', label: 'Testimonios' },
  { href: '/admin/ofertas', label: 'Ofertas' },
  { href: '/admin/campanas', label: 'Campañas' },
  { href: '/admin/experimentos', label: 'Experimentos' },
  { href: '/admin/ventas', label: 'Ventas' },
  { href: '/admin/alumnos', label: 'Alumnos' },
  { href: '/admin/preguntas', label: 'Preguntas' },
  { href: '/admin/afiliados', label: 'Afiliados' },
  { href: '/admin/leads', label: 'Leads' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Primera barrera. La segunda son las políticas RLS `*_write_admin`.
  const { profile } = await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de administración</h1>
          <p className="mt-1 text-sm text-mist-400">{profile.email}</p>
        </div>
        <Link href="/" className="text-sm text-mist-400 hover:text-mist-50">
          Ver el sitio público →
        </Link>
      </div>

      <nav className="mt-6 flex flex-wrap gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-50"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
