import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Política de reembolsos' };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Política de reembolsos</h1>
      <p className="mt-2 text-sm text-mist-400">Última actualización: pendiente de publicación.</p>

      <div className="mt-8 space-y-4 text-mist-200">
        <p>
          Dispones de 14 días naturales desde la compra para solicitar el reembolso íntegro,
          escribiendo a soporte con el email con el que compraste.
        </p>
        <p>Al aprobarse el reembolso se revoca automáticamente el acceso al contenido asociado.</p>
        <p>
          Las suscripciones pueden cancelarse en cualquier momento desde el portal de facturación;
          el acceso continúa hasta el final del periodo ya abonado.
        </p>
      </div>

      <p className="mt-10 rounded-xl border border-dashed border-ink-700 p-5 text-sm text-mist-400">
        Este texto es una plantilla de trabajo. Antes de abrir ventas al público, revísalo con
        asesoría legal y adáptalo a la jurisdicción en la que factures.
      </p>
    </article>
  );
}
