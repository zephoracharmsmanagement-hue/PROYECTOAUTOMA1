# Panel de administración

Ruta: `/admin`. No aparece en la navegación pública y lleva `robots: noindex`.

## Cómo darte acceso

El rol **no** se asigna desde la interfaz: promover a un administrador es una
operación deliberadamente manual, para que nadie pueda escalar privilegios desde
el propio panel.

```sql
-- Regístrate primero en la web con tu email, luego ejecuta esto en Supabase.
update public.profiles set role = 'admin' where email = 'tu@email.com';
```

## Modelo de seguridad

Dos barreras independientes:

1. **`requireAdmin()`** (`src/lib/admin/guard.ts`) protege el layout y cada
   Server Action. Un usuario autenticado sin rol admin se redirige a
   `/dashboard`; uno anónimo, a `/login`.
2. **Políticas RLS `*_write_admin`** (migración `20260910000000`). El panel usa el
   cliente de Supabase **del propio usuario**, no `service_role`, así que la base
   de datos vuelve a comprobar `is_admin()` en cada escritura.

Esto es intencionado: si la guardia de la interfaz tuviera un fallo, Postgres
seguiría rechazando la operación. Usar `service_role` en el panel habría
desactivado esa segunda barrera.

Toda Server Action valida su entrada con zod antes de tocar la base de datos, y
ninguna acepta identificadores que no sean UUID.

## Secciones

### Resumen (`/admin`)

Métricas de negocio vía `admin_dashboard_metrics()`, una función `security
definer` que agrega ingresos y volumen sin exponer filas individuales y que
lanza excepción si quien la llama no es admin.

Encima de las métricas aparecen los **avisos que bloquean la venta**:

- Paquetes publicados con precio pero sin `price_id` real de Stripe (incluye
  detección de los marcadores `price_REEMPLAZAR` del seed).
- Planes activos con `price_id` de marcador.
- Lecciones sin video asignado.

Cada aviso enlaza directamente a la pantalla donde se corrige.

### Paquetes (`/admin/paquetes`)

Alta, edición, publicación y archivado. Publicar hace visible el paquete en el
catálogo público de inmediato.

**Reglas que impone el panel:**

- No se puede publicar un paquete de pago único sin precio y sin `price_id` de
  Stripe: sería una ficha de venta con un botón roto. Sí se permite publicarlo
  sin precio si está incluido en la membresía.
- No se puede borrar un paquete con ventas registradas. La alternativa es
  archivarlo, que lo retira del catálogo conservando el historial de facturación
  y el acceso de quien ya lo compró.

En la ficha de edición se gestiona el **temario completo**: crear módulos y
lecciones, reordenarlos y asignar el video de cada lección.

Dos campos usan texto plano estructurado en lugar de un editor de repetidores,
porque son listas cortas que se editan de tirón:

- Bullets de valor del paquete: `Título | Detalle`, uno por línea.
- Recursos de una lección: `Etiqueta | https://url`, uno por línea.

La duración acepta `mm:ss` o `h:mm:ss`.

### Planes (`/admin/planes`)

Los planes **no se borran**: se desactivan. Borrarlos rompería el enlace
`subscriptions.plan_id` de quien ya está suscrito. Desactivar solo los retira de
la página de precios; las suscripciones vivas siguen funcionando.

### Ventas (`/admin/ventas`)

Últimas compras, suscripciones y los **últimos eventos de Stripe procesados**.
Esa tercera tabla existe para responder a la pregunta operativa más frecuente:
_"el cliente pagó y no tiene acceso"_. Si su evento no aparece, el problema está
en la configuración del webhook, no en la aplicación.

### Alumnos (`/admin/alumnos`)

Concesión manual de acceso por email, y revocación.

- La concesión queda marcada como `source = 'manual_grant'`, distinguible siempre
  de una compra en la auditoría.
- Revocar **no borra la fila**: cambia el estado a `revoked`. El rastro de por
  qué alguien tuvo acceso es parte de la auditoría, y por eso las políticas RLS
  no conceden `DELETE` sobre `entitlements`.
- El usuario debe tener cuenta creada: el acceso se ata a un `user_id` real, no a
  un email suelto.

Casos de uso reales: recuperar una compra cuyo webhook falló, regalar un paquete,
dar acceso a un afiliado o a un colaborador.

### Leads (`/admin/leads`)

Listado de los 200 más recientes y exportación completa a CSV en
`/admin/leads/export`, protegida por la misma guardia.

## Reordenar

Módulos y lecciones se reordenan intercambiando `sort_order` con el vecino, no
reescribiendo toda la lista. Es una operación local: dos ediciones simultáneas en
partes distintas del temario no se pisan.
