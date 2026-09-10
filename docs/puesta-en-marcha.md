# Puesta en marcha — empieza aquí

Todo lo que hay que hacer, en orden, para pasar del repositorio a una tienda
cobrando de verdad.

**La numeración de fases es una dependencia, no un adorno:** cada una necesita
que la anterior esté hecha.

> Existe una versión interactiva de este mismo documento, con casillas que
> recuerdan tu progreso: **Arranque de Automa**
> (<https://claude.ai/code/artifact/1757b634-d183-4718-b95e-a222b348c502>).

---

## Antes de empezar

El código está completo, compila y pasa lint y tipos, pero **nunca se ha
ejecutado contra una base de datos real ni contra Stripe**. La fase 4 no es
opcional: es donde se descubre lo que la comprobación estática no puede ver.

Todo en **modo test de Stripe** hasta la fase 7. Una clave `sk_live_` en tu
portátil es un accidente esperando a pasar.

---

## Fase 0 — Lo que necesitas tener

- [ ] **Node.js 20.11 o superior** — `node --version`. Con una versión anterior el build falla.
- [ ] **Docker Desktop** instalado y arrancado — Supabase local corre dentro. Sin él puedes usar un proyecto en la nube, pero cada error de migración lo pagas en un entorno compartido.
- [ ] **Cuentas en Supabase, Stripe y Bunny** — Resend, Plausible y Anthropic son opcionales (fase 6).
- [ ] **Stripe CLI** — es lo que reenvía los webhooks a tu portátil. Sin esto pagas y no pasa nada más: el acceso lo concede el webhook, no la página de éxito.

---

## Fase 1 — Levantar el entorno local

Al final tienes la web abierta con el catálogo de demostración.

- [ ] **Clonar e instalar**

  ```bash
  git clone https://github.com/zephoracharmsmanagement-hue/PROYECTOAUTOMA1.git
  cd PROYECTOAUTOMA1
  git checkout claude/saas-ecommerce-packages-web-7tbz0e
  npm install
  ```

- [ ] **Crear tu archivo de variables** — `.env.local` está en `.gitignore`, nunca se sube.

  ```bash
  cp .env.example .env.local
  ```

- [ ] **Arrancar Supabase local** — tarda un par de minutos la primera vez. Al terminar imprime una tabla con todas las URLs y claves; guárdala.

  ```bash
  npx supabase start
  ```

- [ ] **Rellenar las tres variables de Supabase** con los valores de esa tabla:

  ```bash
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  NEXT_PUBLIC_SUPABASE_URL=      # "API URL"
  NEXT_PUBLIC_SUPABASE_ANON_KEY= # "anon key"
  SUPABASE_SERVICE_ROLE_KEY=     # "service_role key"
  ```

  > La `service_role` salta todas las reglas de seguridad de la base de datos.
  > No la pegues nunca en una variable que empiece por `NEXT_PUBLIC_`: eso la
  > publica en el navegador.

- [ ] **Crear el esquema y cargar el ejemplo** — aplica las 13 migraciones en orden y ejecuta el seed.

  ```bash
  npm run db:reset
  ```

  > Este comando **borra y recrea** la base. En local es lo que quieres; contra
  > un proyecto en la nube, jamás.

- [ ] **Arrancar la web** — `npm run dev`, y abre `http://localhost:3000`. Si falla al cargar, casi siempre es una variable mal copiada: el error dice cuál.

---

## Fase 2 — Tu cuenta de administrador

El rol solo se concede desde SQL, a propósito: así no existe ningún camino para
que alguien se ascienda a sí mismo desde el panel.

- [ ] **Registrarte en la web** con tu email desde `/login`. En local el correo no sale a internet: aparece en el visor de email que levantó `supabase start` (su URL está en esa tabla).

  > **Regístrate antes de ascenderte.** El SQL siguiente actualiza una fila que
  > solo existe después del registro.

- [ ] **Ascenderte a administrador**, en el SQL Editor de Supabase Studio:

  ```sql
  update public.profiles
     set role = 'admin'
   where email = 'tu@email.com';
  ```

- [ ] **Entrar en `/admin` y leer los avisos.** Arriba verás «cosas que bloquean la venta». Ahora debería avisar de que los paquetes tienen precios de marcador (`price_REEMPLAZAR_…`). Es correcto: se arregla en la fase 3.

---

## Fase 3 — Stripe en modo test

El interruptor «Test mode» del panel de Stripe activado durante toda la fase.

- [ ] **Crear productos y precios**: cinco en total — un precio _de pago único_ por cada uno de los tres paquetes, y dos _recurrentes_ (mensual y anual) para la membresía.

- [ ] **Pegar los precios en el panel** — en `/admin/paquetes` y `/admin/planes`.

  > El importe que escribes en la web es solo texto; **lo que se cobra es el
  > precio de Stripe**. Si no coinciden, el cliente paga lo que diga Stripe.

- [ ] **Reenviar los webhooks a tu portátil**, en una terminal aparte que dejas abierta:

  ```bash
  npm run stripe:listen
  ```

  Imprime un secreto `whsec_…`. Cópialo a `STRIPE_WEBHOOK_SECRET` y **reinicia
  `npm run dev`**: las variables se leen al arrancar.

- [ ] **Añadir las claves de API**:

  ```bash
  STRIPE_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```

- [ ] **Comprobar que los avisos del panel han desaparecido.** No pases a la fase 4 con avisos pendientes.

---

## Fase 4 — Probar el flujo crítico

La fase más importante del documento. Tarjeta de prueba: `4242 4242 4242 4242`,
cualquier fecha futura, cualquier CVC.

- [ ] **Comprar un paquete y confirmar el acceso.** En menos de diez segundos debe aparecer en `/dashboard`. Mira también la terminal de `stripe listen`.

  > Si pagas y no tienes acceso, el problema está en el webhook, no en la web.
  > `/admin/ventas` lista los últimos eventos procesados: si el tuyo no aparece,
  > no llegó.

- [ ] **Intentar comprar el mismo paquete otra vez** — debe bloquearse con un mensaje claro.

- [ ] **Probar un order bump.** Crea una oferta en `/admin/ofertas`, compra marcando la casilla y comprueba que llegan **los dos accesos y un solo email**. Es el camino con más piezas nuevas del proyecto.

- [ ] **Reembolsar y confirmar que el acceso desaparece.** Con un order bump debe retirarse **todo lo que traía la orden**, no solo el paquete principal.

- [ ] **Suscribirte** y confirmar que `/dashboard` muestra el catálogo completo.

- [ ] **Cancelar** y confirmar que el acceso **no** se corta en ese momento: dura hasta el final del periodo pagado. Los paquetes de pago único siguen siendo tuyos para siempre.

- [ ] **Comprobar que una firma inválida se rechaza.** Una petición a `/api/webhooks/stripe` sin cabecera de firma debe responder 400 y no tocar la base de datos.

---

## Fase 5 — Tu contenido real

- [ ] **Crear la librería de Bunny Stream**:

  ```bash
  BUNNY_STREAM_LIBRARY_ID=
  BUNNY_STREAM_API_KEY=
  BUNNY_TOKEN_TTL_MINUTES=180
  ```

  La clave firma los enlaces de reproducción y **nunca sale del servidor**: el
  navegador solo recibe un token con caducidad.

- [ ] **Subir un vídeo y pegar su GUID** en el campo «ID del vídeo» de la lección. Prueba a reproducirlo antes de subir el resto.

- [ ] **Marcar una lección como gratuita.** Es el gancho de conversión. Elige una que enseñe el resultado terminado, no una introducción.

- [ ] **Reescribir los textos de venta.** Los tres paquetes del seed son de ejemplo.

- [ ] **Escribir las transcripciones** _(solo si quieres asistente)_. Es lo único que lee. Separa las ideas por párrafos: el índice trocea por párrafo, no por número de caracteres.

---

## Fase 6 — Los tres opcionales

Ninguno hace falta para vender. Sin configurar, cada uno se apaga solo.

- [ ] **Email transaccional (Resend)**

  ```bash
  RESEND_API_KEY=
  EMAIL_FROM=Automa <no-reply@tudominio.com>
  EMAIL_REPLY_TO=soporte@tudominio.com
  ```

  **Verifica el dominio (SPF y DKIM) antes de enviar nada.** Sin verificar, los
  correos de compra van a spam, que es peor que no enviarlos.

- [ ] **Analítica**

  ```bash
  NEXT_PUBLIC_ANALYTICS_PROVIDER=plausible
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN=tudominio.com
  ```

  Plausible no usa cookies, así que no obliga a banner de consentimiento. **Si
  eliges GA4 sí lo necesitas** en la UE.

- [ ] **Asistente con IA**

  ```bash
  ANTHROPIC_API_KEY=
  ASSISTANT_DAILY_MESSAGE_LIMIT=30
  ```

  Después, en la ficha del paquete, pulsa **«Reconstruir índice»**. Sin eso el
  asistente no tiene nada que leer, por muchas transcripciones que haya. El tope
  diario existe porque cada pregunta cuesta dinero real.

---

## Fase 7 — Salir a producción

Proyecto de Supabase **distinto** al de desarrollo: compartirlos significa que un
`db:reset` tuyo borra datos de clientes.

- [ ] **Proyecto de producción** — enlázalo y aplica migraciones con `npm run db:push`. **Nunca `db:reset` aquí.** Activa los backups antes de la primera venta.

- [ ] **Auth con tu dominio y tu SMTP** — Site URL y Redirect URLs reales, plantilla del enlace personalizada, y SMTP propio: el de Supabase tiene límites bajos y te dejará clientes fuera en un lanzamiento.

- [ ] **Desplegar y cargar las variables.** `NEXT_PUBLIC_SITE_URL` debe coincidir **exactamente** con el dominio servido: de ella dependen las URLs de retorno de Stripe y el enlace de acceso por email.

- [ ] **Crear el webhook de producción** apuntando a `https://tudominio.com/api/webhooks/stripe`, con **los nueve eventos**:

  ```
  checkout.session.completed
  checkout.session.expired
  customer.subscription.created
  customer.subscription.updated
  customer.subscription.deleted
  invoice.paid
  invoice.payment_failed
  charge.refunded
  charge.dispute.created
  ```

  Copia el nuevo `whsec_` a producción: **es distinto del de tu portátil**.

- [ ] **Pasar Stripe a modo live.** Claves `sk_live_` y `pk_live_` solo en producción. Y vuelve a crear productos y precios en live: **los identificadores de test no funcionan en live**, hay que repegarlos todos. Activa el Billing Portal, o el botón de gestionar suscripción fallará.

- [ ] **Revisión legal.** Las páginas de `/legal` son plantillas de trabajo y lo dicen en la propia página. Comprueba que la política de reembolsos coincide con `GUARANTEE_DAYS` en `src/config/site.ts`.

- [ ] **Compra real de bajo importe, y reembolsarla.** Con dinero de verdad, en el dominio de verdad. Es la única prueba que cubre la cadena completa en condiciones reales.

---

## Lo que sigue sin hacer

**No hay tests de integración.** Las cuatro fases del proyecto se han verificado
de forma estática (tipos, lint, build), nunca ejecutando. La fase 4 de este
documento es tu red de seguridad, y es manual: si cambias algo del flujo de pago
más adelante, tendrás que repetirla entera a mano.

Convertirla en tests automáticos contra Supabase local y Stripe en modo test está
anotado en el roadmap como Fase 5, y es lo que más valor tiene ahora mismo.

---

## Dónde está documentado cada cosa

| Documento           | Cubre                                       |
| ------------------- | ------------------------------------------- |
| `architecture.md`   | Cómo encaja todo y por qué                  |
| `data-model.md`     | Tablas, relaciones y decisiones de modelado |
| `payments.md`       | Stripe paso a paso y flujo de webhooks      |
| `admin.md`          | El panel y su modelo de permisos            |
| `video-delivery.md` | Bunny y protección del contenido            |
| `deployment.md`     | Entornos y checklist de producción          |
| `growth.md`         | SEO, analítica, email y testimonios         |
| `conversion.md`     | Bumps, upsells, campañas, A/B, certificados |
| `operations.md`     | Métricas, dunning, afiliados y Q&A          |
| `product.md`        | Rutas de aprendizaje y automatizaciones     |
| `assistant.md`      | El asistente con IA                         |
