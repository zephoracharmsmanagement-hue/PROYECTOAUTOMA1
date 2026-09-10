# Arquitectura

## Visión general

```
Visitante ──▶ Landing / Catálogo (RSC, cacheado 5 min)
                    │
                    ▼
              CheckoutButton ──▶ POST /api/checkout
                                      │  (resuelve precio en servidor)
                                      ▼
                               Stripe Checkout
                                      │
                     ┌────────────────┴────────────────┐
                     ▼                                 ▼
       redirect /checkout/exito            POST /api/webhooks/stripe
       (solo informa, NO da acceso)        (firma verificada, service_role)
                                                       │
                                                       ▼
                                            entitlements  (fuente de verdad)
                                                       │
                     ┌─────────────────────────────────┤
                     ▼                                 ▼
        /biblioteca (RSC + RLS)          GET /api/lessons/:id/playback
                                          (verifica acceso → firma Bunny)
```

## Principios

### 1. Un único punto de verdad para el acceso

La pregunta "¿puede este usuario ver esto?" se responde en **un solo sitio
conceptual**, implementado en dos capas que dicen lo mismo:

- `src/lib/entitlements.ts` → decisión en la aplicación (UI, redirecciones).
- `public.has_package_access()` en SQL → decisión en la base de datos (RLS).

Duplicar la regla en SQL no es redundancia gratuita: si un día una consulta
olvida filtrar, RLS sigue tapando el agujero. La API de reproducción llama
directamente a la función SQL vía RPC para no tener una tercera versión.

### 2. Stripe no es la base de datos

Stripe es el procesador de pagos, no el sistema de permisos. Consultarlo en cada
carga de página sería lento, frágil y caro. En su lugar, el webhook **proyecta**
los eventos de Stripe sobre la tabla `entitlements`, y la app solo lee de ahí.

Consecuencia: el webhook es infraestructura crítica. Está diseñado para ser
idempotente (tabla `webhook_events`) y para devolver 500 ante fallos, de modo que
Stripe reintente.

### 3. El servidor decide el precio

`POST /api/checkout` recibe únicamente un slug. El importe y el `price_id` se
leen de la base de datos. Manipular la petición desde el navegador no puede
alterar lo que se cobra.

### 4. El video nunca se sirve directamente

El HTML jamás contiene una URL de video reutilizable. El reproductor pide un
enlace firmado a `/api/lessons/:id/playback`, que verifica el entitlement antes
de firmar y devuelve un token con caducidad.

## Modelo de renderizado

| Ruta                                             | Estrategia                  | Motivo                                       |
| ------------------------------------------------ | --------------------------- | -------------------------------------------- |
| `/`, `/paquetes`, `/paquetes/[slug]`, `/precios` | RSC con `revalidate = 300`  | SEO y velocidad; el catálogo cambia poco     |
| `/dashboard`, `/biblioteca/**`, `/cuenta`        | `dynamic = 'force-dynamic'` | Dependen de la sesión; nunca deben cachearse |
| `/api/**`                                        | Node runtime, dinámico      | Necesitan `crypto` y secretos de servidor    |

El middleware (`src/middleware.ts`) refresca el token de Supabase en cada
petición y bloquea el área de miembros para usuarios anónimos. **No** decide qué
paquete puede ver cada usuario: eso vive en RLS y en `entitlements.ts`, para que
un fallo del middleware no abra contenido de pago.

## Extensión: añadir un proveedor de video

1. Implementa `VideoProvider` en `src/lib/video/<proveedor>.ts`.
2. Añade el caso al `switch` de `src/lib/video/index.ts`.
3. Añade el valor al enum `video_provider` con una migración.

Ningún componente de la aplicación cambia: todos consumen `signPlayback()`.
