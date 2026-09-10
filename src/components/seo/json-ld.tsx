/**
 * Inserta datos estructurados en la página.
 *
 * El contenido procede siempre de datos propios (base de datos o configuración),
 * nunca de entrada de usuario sin validar; aun así se escapa `<` para impedir
 * que un valor con `</script>` cierre la etiqueta antes de tiempo.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
