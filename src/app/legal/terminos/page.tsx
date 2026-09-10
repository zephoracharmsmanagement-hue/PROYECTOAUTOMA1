import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Términos y condiciones' };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-mist-400">Última actualización: pendiente de publicación.</p>

      <div className="mt-8 space-y-4 text-mist-200">
        <p>
          Al comprar un paquete o activar una membresía aceptas estas condiciones de uso de la
          plataforma.
        </p>
        <p>
          El acceso a los contenidos es personal e intransferible. Está prohibida la redistribución,
          reventa o publicación de los videos y materiales descargables.
        </p>
        <p>
          Los paquetes adquiridos en pago único conservan el acceso de forma indefinida mientras la
          plataforma esté operativa. Las membresías dan acceso mientras la suscripción esté vigente.
        </p>
      </div>

      <p className="mt-10 rounded-xl border border-dashed border-ink-700 p-5 text-sm text-mist-400">
        Este texto es una plantilla de trabajo. Antes de abrir ventas al público, revísalo con
        asesoría legal y adáptalo a la jurisdicción en la que factures.
      </p>
    </article>
  );
}
