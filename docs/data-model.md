# Modelo de datos

## Diagrama de relaciones

```
auth.users ──1:1──▶ profiles ──┬──▶ orders ──────┐
                               ├──▶ subscriptions┤
                               ├──▶ entitlements ◀┘  (concedidos por el webhook)
                               └──▶ lesson_progress

packages ──1:N──▶ modules ──1:N──▶ lessons
   ▲                                  ▲
   └── entitlements.package_id        └── lesson_progress.lesson_id

plans ──1:N──▶ subscriptions
```

## Tablas

### `profiles`

Extiende `auth.users`. Se crea automáticamente con el trigger
`on_auth_user_created`. Guarda `stripe_customer_id`, que se genera de forma
perezosa en el primer checkout y **se reutiliza siempre**: un único customer por
usuario es lo que permite que compras sueltas y suscripción convivan en la misma
ficha de facturación.

### `packages` → `modules` → `lessons`

Jerarquía del catálogo.

- `price_one_time_cents`: importe en **centavos** (entero). Nunca se usa `float`
  para dinero.
- `included_in_subscription`: permite excluir un paquete premium de la membresía
  sin tocar código.
- `lessons.is_preview`: lección gratuita, servible sin sesión. Es el gancho de
  conversión.
- `lessons.video_asset_id`: identificador en Bunny. **RLS lo oculta** a quien no
  tiene acceso; el temario público se sirve por la vista `lesson_outline`, que no
  incluye esta columna.

### `plans`

Planes de suscripción, enlazados a Stripe por `stripe_price_id`.

### `orders` y `subscriptions`

Proyección local de lo ocurrido en Stripe. `orders` se identifica por
`stripe_checkout_session_id` (único) y `subscriptions` por
`stripe_subscription_id`, lo que hace que los reintentos de webhook sean
idempotentes por construcción.

### `entitlements` — la tabla central

```sql
kind = 'package'    → package_id obligatorio  (compra suelta)
kind = 'all_access' → package_id NULL         (membresía)
```

Restricciones que hacen el sistema robusto:

- `entitlement_package_shape`: impide filas incoherentes (un `all_access` con
  paquete, o un `package` sin él).
- Índices únicos parciales: **una sola concesión viva** por usuario+paquete y una
  sola de all-access por usuario. Gracias a ellos, el webhook puede hacer `upsert`
  sin comprobar antes si existe.
- `expires_at NULL` = acceso vitalicio (compra única). En la membresía se fija al
  final del periodo pagado: si un evento de Stripe llega tarde, el usuario no
  pierde el acceso que ya pagó.

### `lesson_progress`

Progreso del alumno. Es la **única** tabla donde el usuario escribe directamente;
la política `progress_upsert_own` revalida el entitlement en cada inserción.

### `webhook_events`

Registro de idempotencia. El `stripe_event_id` es único: si Stripe reenvía un
evento, el `insert` falla con `23505` y el manejador sale sin duplicar efectos.
Sin políticas RLS → inaccesible salvo con `service_role`.

### `leads`

Captura de emails desde la landing. Inserción pública permitida, lectura solo
para admin. El índice único `(email, source)` convierte un reenvío en un no-op.

## Reglas de acceso en SQL

```sql
has_all_access(uid)            -- membresía viva
has_package_access(uid, pkg)   -- compra directa OR (membresía AND incluido)
is_admin(uid)
```

Son `security definer` para poder consultar `entitlements` sin quedar atrapadas
en las propias políticas que respaldan.

## Convenciones

- Dinero: **enteros en centavos**, nunca decimales flotantes.
- Tiempos: `timestamptz`, siempre UTC en la base.
- Enums de Postgres para estados cerrados; `text` crudo para `subscriptions.status`,
  porque el conjunto lo define Stripe y puede crecer sin aviso.
- Todo cambio de esquema entra por una migración nueva en `supabase/migrations/`.
  Nunca se edita una migración ya aplicada en producción.
