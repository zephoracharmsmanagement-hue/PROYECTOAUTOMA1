import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Política de privacidad' };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Política de privacidad</h1>
      <p className="mt-2 text-sm text-mist-400">Última actualización: pendiente de publicación.</p>

      <div className="mt-8 space-y-4 text-mist-200">
        <p>
          Tratamos únicamente los datos necesarios para prestar el servicio: email, datos de
          facturación gestionados por Stripe y progreso de visualización.
        </p>
        <p>
          Los pagos se procesan íntegramente en Stripe. No almacenamos números de tarjeta en
          nuestros servidores.
        </p>
        <p>
          Puedes solicitar el acceso, la rectificación o la eliminación de tus datos escribiendo a
          nuestro correo de soporte.
        </p>
      </div>

      <p className="mt-10 rounded-xl border border-dashed border-ink-700 p-5 text-sm text-mist-400">
        Este texto es una plantilla de trabajo. Antes de abrir ventas al público, revísalo con
        asesoría legal y adáptalo a la jurisdicción en la que factures.
      </p>
    </article>
  );
}
