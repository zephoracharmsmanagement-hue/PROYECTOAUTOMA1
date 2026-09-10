import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{siteConfig.name}</p>
          <p className="mt-1 max-w-sm text-sm text-mist-400">{siteConfig.tagline}</p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist-400">
          {siteConfig.legal.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-mist-50">
              {item.label}
            </Link>
          ))}
          <a href={`mailto:${siteConfig.support.email}`} className="hover:text-mist-50">
            Soporte
          </a>
        </div>
      </div>

      <div className="border-t border-ink-800 px-4 py-4 text-center text-xs text-mist-400">
        © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
