# SEO, analítica, email y prueba social

Todo lo que convierte una web funcional en una web que vende. Cuatro piezas
independientes: puedes desplegar sin ninguna configurada y nada se rompe.

---

## 1. SEO técnico

### Qué se genera solo

| Recurso       | Ruta                                                    | Detalle                                                                                                                                            |
| ------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sitemap       | `/sitemap.xml`                                          | Páginas fijas + un `<url>` por paquete publicado, con `lastModified`. Se revalida cada hora, así que publicar un paquete no espera a un despliegue |
| Robots        | `/robots.txt`                                           | Bloquea `/admin`, `/dashboard`, `/biblioteca`, `/cuenta`, `/checkout` y `/api/`                                                                    |
| Imagen social | `/opengraph-image` y `/paquetes/<slug>/opengraph-image` | 1200×630 generadas al vuelo con el título y la promesa reales del paquete                                                                          |
| Canonical     | Todas las páginas públicas                              | Vía `alternates.canonical`                                                                                                                         |

`robots.txt` **no es un control de acceso**: solo pide a los buscadores que no
indexen. El área de miembros la protegen el middleware y RLS.

### Datos estructurados (JSON-LD)

Generados en `src/lib/seo/json-ld.ts` e insertados con `<JsonLd>`:

| Página           | Tipos                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Portada          | `Organization`, `WebSite`, `FAQPage`                                                             |
| Ficha de paquete | `Product` + `Offer`, `BreadcrumbList`, y `Review`/`AggregateRating` si hay testimonios puntuados |
| Precios          | `Product` con un `Offer` por plan                                                                |

**Regla que impone el código:** el bloque `Offer` solo se emite si el paquete
tiene precio _y_ `stripe_price_id`. Declarar un precio que el visitante no puede
pagar es motivo de sanción manual en Google.

Lo mismo con las reseñas: `aggregateRating` y `review` solo aparecen si existen
testimonios reales con puntuación en la base de datos. Nunca se inventan.

### Lo que sigue siendo tuyo

- Dar de alta el dominio en Google Search Console y enviar el sitemap.
- Escribir los textos: el SEO técnico posiciona lo que hay, no crea contenido.

---

## 2. Analítica

Proveedor configurable por entorno. Por defecto está **apagada**:

```bash
NEXT_PUBLIC_ANALYTICS_PROVIDER=none       # none | plausible | ga4
```

**Plausible** es la opción recomendada: sin cookies ni datos personales, así que
no obliga a banner de consentimiento. **GA4 sí lo requiere en la UE**; si lo
activas, añade tu gestor de consentimiento antes de publicar.

Con `provider=none`, `track()` es un no-op silencioso: desarrollo y previews no
ensucian los datos de producción.

### Embudo instrumentado

Los nombres de evento viven en un catálogo cerrado y tipado
(`src/lib/analytics/events.ts`), para que no acaben escritos de tres formas
distintas y sin poder agregarse:

| Evento               | Dónde se dispara                  | Propiedades      |
| -------------------- | --------------------------------- | ---------------- |
| `lead_submitted`     | Formulario de captura             | `source`         |
| `begin_checkout`     | Al pulsar comprar/suscribirse     | `kind`, `item`   |
| `checkout_failed`    | Si la creación de la sesión falla | `kind`, `reason` |
| `purchase_confirmed` | Página de retorno de Stripe       | `kind`           |

`purchase_confirmed` es **solo atribución**. El acceso lo concede el webhook, así
que un usuario que cierre el navegador antes del redirect tendrá su compra pero
no aparecerá en este evento. Para cifras de negocio reales usa el panel
(`/admin`), que lee de la base de datos.

---

## 3. Email transaccional

Resend, vía `fetch` contra su API — no añade una dependencia por un solo
endpoint.

### Emails que salen solos

| Disparador                                | Email                                             |
| ----------------------------------------- | ------------------------------------------------- |
| `checkout.session.completed` (pago único) | Confirmación de compra con enlace a la biblioteca |
| Alta de suscripción                       | Bienvenida a All Access                           |
| `invoice.payment_failed`                  | Aviso para actualizar el método de pago           |
| Concesión manual desde el panel           | Aviso de acceso nuevo (casilla activable)         |

### La regla que lo hace seguro

**El envío de email nunca puede tumbar el flujo que lo dispara.** En el webhook,
cada envío pasa por un `notify()` que traga cualquier excepción. Si un error de
email escapara, el webhook devolvería 500, Stripe reintentaría el evento y el
cliente recibiría el mismo correo varias veces. En ese punto el acceso ya está
concedido: el email es accesorio.

Sin `RESEND_API_KEY` o `EMAIL_FROM`, el envío se registra en el log y se omite.

### Duplicados en el alta de suscripción

`checkout.session.completed` y `customer.subscription.created` describen el mismo
alta. Para no enviar dos bienvenidas, `syncSubscription` comprueba si la
suscripción ya existía en la base local y solo saluda la primera vez.

### Configurar Resend

1. Crea una API key en <https://resend.com/api-keys>.
2. Verifica tu dominio (SPF + DKIM). Sin verificar, los emails van a spam.
3. Rellena `RESEND_API_KEY`, `EMAIL_FROM` y, opcionalmente, `EMAIL_REPLY_TO`.

---

## 4. Testimonios

Tabla `testimonials`, gestionada en `/admin/testimonios`.

- **Sin paquete asociado** → testimonio general, se muestra en la portada.
- **Con paquete** → aparece además en la ficha de venta de ese paquete.
- **Con puntuación** → alimenta el marcado `Review` que lee Google.

El campo que más convierte es `result`: un resultado concreto y medible
("3.400 USD en 30 días") pesa más que un elogio genérico. `source_url` permite
enlazar la publicación o el vídeo que lo respalda.

Si no hay testimonios publicados, la sección **no se renderiza**: un hueco vacío
donde debería haber prueba social resta más de lo que suma.

> **Aviso legal.** Publicar testimonios inventados —y más aún exponerlos como
> datos estructurados de reseña— infringe las políticas de Google y la normativa
> de publicidad y protección al consumidor. Usa solo testimonios reales y
> verificables.
