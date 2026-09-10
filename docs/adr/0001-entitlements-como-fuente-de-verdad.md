# ADR 0001 — `entitlements` como única fuente de verdad del acceso

- **Estado:** aceptado
- **Fecha:** 2026-09-10

## Contexto

Se venden paquetes en pago único y una membresía all-access. Un mismo usuario
puede tener las dos cosas a la vez. Hace falta responder "¿puede ver esto?" en
cada carga de página del área de miembros.

Opciones consideradas:

1. Consultar la API de Stripe en cada petición.
2. Derivar el acceso de las tablas `orders` y `subscriptions`.
3. Una tabla `entitlements` que proyecta ambas fuentes.

## Decisión

Opción 3. `entitlements` es la única tabla que se consulta para autorizar.

## Razones

- **Rendimiento**: una consulta local frente a una llamada de red por página.
- **Disponibilidad**: si Stripe tiene una incidencia, los alumnos siguen
  estudiando.
- **Uniformidad**: compra, membresía y concesión manual (soporte, regalo,
  afiliado) producen el mismo tipo de fila, así que la lógica de lectura no tiene
  ramas por origen.
- **Auditoría**: se ve de un vistazo qué tiene cada usuario y de dónde viene.
- **RLS**: Postgres puede aplicar la regla directamente, sin salir a la red.

## Consecuencias

- El webhook de Stripe pasa a ser infraestructura crítica: si falla, el usuario
  paga y no recibe acceso. Se mitiga con idempotencia, respuestas 500 para forzar
  reintentos de Stripe y monitorización del endpoint.
- Hay duplicación deliberada de estado entre Stripe y la base local. Los eventos
  de suscripción la mantienen sincronizada; ante discrepancias, **Stripe manda** y
  se corrige reenviando el evento desde el Dashboard.
- La regla de acceso vive en dos lenguajes (TypeScript y SQL). Se acepta como
  defensa en profundidad, y la API de reproducción llama a la versión SQL por RPC
  para no crear una tercera.
