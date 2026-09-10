# Automa — Plataforma de paquetes SaaS para Ecommerce

Web de venta de **paquetes formativos/operativos** de ecommerce, dropshipping y
automatización con IA. Cada paquete es una implementación grabada en video con
plantillas descargables. Monetización **híbrida**:

- **Pago único** por paquete → acceso vitalicio a ese paquete.
- **Membresía All Access** (mensual/anual) → todo el catálogo mientras esté activa.

---

## Stack

| Capa           | Tecnología                                  | Por qué                                                                        |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| Frontend / SSR | Next.js 15 (App Router, RSC) + TypeScript   | Renderizado en servidor para SEO de las landings y gating seguro del contenido |
| Estilos        | Tailwind CSS v4                             | Sin runtime, tokens de diseño en CSS                                           |
| Datos + Auth   | Supabase (Postgres, Auth, RLS, Storage)     | Postgres relacional real para entitlements + seguridad a nivel de fila         |
| Pagos          | Stripe Checkout + Billing Portal + Webhooks | Soporta `payment` y `subscription` con la misma ficha de cliente               |
| Video          | Bunny Stream (URLs firmadas)                | Coste bajo y tokens de reproducción con caducidad                              |

---

## Estructura del repositorio

```
.
├── docs/                     Documentación de arquitectura y operación
│   ├── architecture.md       Visión general y flujo de datos
│   ├── data-model.md         Tablas, relaciones y decisiones de modelado
│   ├── payments.md           Configuración de Stripe y flujo de webhooks
│   ├── video-delivery.md     Protección y entrega de video
│   ├── deployment.md         Despliegue y variables por entorno
│   ├── roadmap.md            Fases del producto
│   └── adr/                  Architecture Decision Records
├── supabase/
│   ├── migrations/           Esquema versionado (SQL)
│   ├── seed.sql              Catálogo de demostración
│   └── config.toml           Configuración de Supabase local
├── src/
│   ├── app/                  Rutas (App Router)
│   │   ├── api/              Route handlers: checkout, portal, leads, webhook, playback
│   │   ├── paquetes/         Catálogo y ficha de venta
│   │   ├── precios/          Planes de suscripción
│   │   ├── biblioteca/       Área de miembros: módulos y reproductor
│   │   ├── dashboard/        Panel del alumno
│   │   ├── cuenta/           Facturación e historial
│   │   └── legal/            Términos, privacidad, reembolsos
│   ├── components/
│   │   ├── ui/               Primitivas (Button, Badge)
│   │   ├── layout/           Header y footer
│   │   ├── marketing/        Cards de paquete y precio, captura de leads
│   │   └── members/          Checkout, reproductor, progreso, portal
│   ├── lib/
│   │   ├── supabase/         Clientes browser / server / admin / middleware
│   │   ├── stripe/           Cliente, checkout, customers, webhook handlers
│   │   ├── video/            Interfaz VideoProvider + adaptador Bunny
│   │   ├── entitlements.ts   Única lógica de acceso de la app
│   │   ├── env.ts            Validación de variables de entorno (zod)
│   │   └── logger.ts         Log estructurado con redacción de secretos
│   ├── config/site.ts        Textos y navegación del sitio
│   └── types/                Tipos de la base de datos
└── .github/workflows/ci.yml  Typecheck, lint y build en cada push
```

---

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local   # y rellena los valores

# 3. Base de datos (requiere Supabase CLI y Docker)
npx supabase start
npm run db:push              # aplica supabase/migrations
psql "$DATABASE_URL" -f supabase/seed.sql   # opcional: catálogo demo

# 4. Webhook de Stripe en local (terminal aparte)
npm run stripe:listen        # copia el whsec_… a STRIPE_WEBHOOK_SECRET

# 5. Arrancar
npm run dev
```

Comprobaciones antes de subir cambios:

```bash
npm run typecheck && npm run lint && npm run build
```

---

## Reglas de seguridad no negociables

1. **El acceso se decide solo por la tabla `entitlements`.** Ninguna página
   consulta a Stripe para saber si un usuario puede ver un video.
2. **Solo el webhook de Stripe concede o revoca acceso.** La página de éxito del
   checkout no otorga nada: el usuario puede cerrar el navegador antes de llegar.
3. **El precio se resuelve siempre en el servidor** a partir del slug. El cliente
   nunca envía importes ni `price_id`.
4. **`SUPABASE_SERVICE_ROLE_KEY` jamás sale del servidor.** Los módulos que la
   usan importan `server-only`, lo que rompe el build si se filtran al cliente.
5. **Las URLs de video se firman con caducidad** y solo tras verificar el
   entitlement.
6. **RLS activado en todas las tablas**, replicando en SQL las mismas reglas de
   acceso que aplica la aplicación.

Documentación detallada en [`docs/`](./docs/architecture.md).
