# ADR 0002 — Monetización híbrida: pago único y suscripción

- **Estado:** aceptado
- **Fecha:** 2026-09-10

## Contexto

Hay que elegir cómo cobrar por los paquetes. El pago único convierte mejor en
frío pero no genera ingreso recurrente; la suscripción maximiza el LTV pero eleva
la barrera de entrada de un comprador que aún no confía en la marca.

## Decisión

Soportar ambos desde el primer día, con el modelo de datos preparado para
activar o desactivar cada vía **por producto**, sin refactor.

- `packages.price_one_time_cents` + `stripe_price_id_one_time` → venta suelta.
- `plans` + `subscriptions` → membresía all-access.
- `packages.included_in_subscription` decide si un paquete entra en la membresía.

## Razones

- Permite validar comercialmente con datos reales cuál de los dos vende mejor,
  en lugar de decidirlo a priori.
- El pago único funciona como puerta de entrada barata; la membresía como
  escalón de mayor valor. Se pueden vender en la misma página.
- Un paquete premium puede excluirse de la membresía cambiando un booleano.
- Añadir la segunda vía después habría obligado a rehacer el modelo de acceso,
  que es justo la parte más delicada del sistema.

## Consecuencias

- Más superficie en el webhook: hay que manejar `payment` y `subscription`.
- La UI debe explicar con claridad qué se obtiene con cada opción para no generar
  fricción por exceso de elección.
- Si un usuario compra un paquete y luego se suscribe, conserva la compra
  vitalicia aunque cancele la membresía. Es intencionado: es lo que se le vendió.
