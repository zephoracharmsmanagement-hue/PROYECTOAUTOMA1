import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="text-sm font-semibold text-brand-400">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Esta página no existe</h1>
      <p className="mt-4 text-mist-400">
        Puede que el enlace haya cambiado o que el paquete ya no esté publicado.
      </p>
      <ButtonLink href="/paquetes" className="mt-8">
        Ver el catálogo
      </ButtonLink>
    </div>
  );
}
