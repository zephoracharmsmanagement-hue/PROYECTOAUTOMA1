# Conversión: bumps, upsells, campañas, experimentos y certificados

Las cinco piezas de la Fase 2. Todas están apagadas hasta que crees el primer
registro desde el panel: sin ofertas, sin campaña y sin experimento activo, el
sitio se comporta exactamente igual que antes.

---

## 1. Order bumps y upsells

Una sola tabla, `offers`, con dos ubicaciones:

| Ubicación | Dónde aparece                                | Cómo se cobra                          |
| --------- | -------------------------------------------- | -------------------------------------- |
| `bump`    | Casilla en la ficha de venta, antes de pagar | Segunda línea en **el mismo** Checkout |
| `upsell`  | Página de confirmación, tras comprar         | Un Checkout nuevo                      |

Se configuran en `/admin/ofertas`.

### Por qué el upsell no es "un clic"

Cobrar de nuevo sin intervención del cliente exige guardar el método de pago y
hacer un cargo _off-session_. En Europa eso choca con la autenticación reforzada
(SCA) y acaba en cargos rechazados o, peor, en disputas. Como el cliente ya
existe en Stripe, el segundo Checkout se completa en dos clics de todos modos.

### Reglas que impone el código

- **Nunca se ofrece algo que el cliente ya tiene.** Se comprueba contra
  `entitlements` tanto al construir el bump como al mostrar el upsell.
- **Cada oferta se valida contra su paquete de origen.** Enviar el id de una
  oferta que pertenece a otro paquete, o que está desactivada, no añade nada al
  carrito. Los precios los resuelve siempre el servidor.
- **Precio especial e id de Stripe van juntos o no van.** El importe que se
  muestra en la web es solo texto; lo que se cobra es el `price` de Stripe. El
  formulario rechaza guardar uno sin el otro, que es como se producen las ofertas
  que anuncian un precio y cobran otro.

### El cambio en el modelo de datos

Hasta ahora una orden equivalía a un paquete. Con bumps, un mismo pago puede
contener varios, así que la orden pasa a ser la transacción y las líneas viven en
`order_items`. `orders.package_id` se conserva apuntando al paquete principal
para no romper el historial existente.

Esto arregla además el reembolso: antes se revocaba solo el paquete de cabecera;
ahora se revoca **todo lo que traía la orden**.

---

## 2. Campañas y cupones

`/admin/campanas`. Una campaña vigente muestra una barra de anuncio en todo el
sitio y, si tiene `stripe_promotion_code_id`, **aplica el descuento sola** en el
checkout.

Aplicarlo automáticamente convierte mejor que pedir al cliente que teclee un
código. Stripe no permite combinar `discounts` con `allow_promotion_codes`, así
que es lo uno o lo otro: con campaña activa se auto-aplica; sin ella, se sigue
mostrando el campo para introducir códigos a mano.

**Vigente ≠ activa.** La ventana de fechas manda: puedes dejar una campaña
programada de antemano y se apaga sola al terminar, sin que nadie tenga que
entrar al panel el día correcto.

Al guardar, el `promo_...` se **verifica contra Stripe**: que existe, que está
activo y que no ha caducado. Es la validación que más disgustos evita — una
campaña publicada con un código mal copiado rompe el checkout de todo el mundo y
solo se descubre cuando alguien intenta pagar.

---

## 3. Carritos abandonados

Stripe caduca las sesiones de Checkout no pagadas y avisa con
`checkout.session.expired`.

El flujo completo:

1. Al crear la sesión se registra la orden como `pending`. **Sin esta fila, un
   carrito abandonado no deja rastro en ninguna parte.**
2. Si se paga, pasa a `paid`.
3. Si caduca, pasa a `expired` y sale un **único** email de recuperación.

Se ven en `/admin/ventas`, con el importe que quedó sin cerrar.

Dos comprobaciones antes de enviar: si el cliente compró el paquete por otra vía
entre medias, no se le escribe; y la idempotencia del webhook garantiza que el
email no salga dos veces. El enlace lleva a la ficha de venta, no a la sesión
caducada.

Es un solo email, no una secuencia de insistencia. Si quieres una cadena, el
sitio natural es tu herramienta de email marketing, alimentada por la tabla
`leads` y el estado de las órdenes.

---

## 4. Experimentos A/B

`/admin/experimentos`. La portada lee la clave `landing_hero` con payload
`{ headline, subheadline, cta }`.

### Cómo funciona el reparto

Determinista, derivado de un identificador anónimo en cookie (`automa_aid`, que
fija el middleware) combinado con la clave del experimento. Consecuencias
prácticas:

- La misma persona ve **siempre** la misma variante.
- No hace falta una cookie por experimento.
- Añadir un experimento nuevo no altera el reparto de los que ya corren.

La variante asignada se adjunta a **todos** los eventos posteriores como
`exp_<clave>`, así que el embudo entero (`begin_checkout`, `purchase_confirmed`…)
queda segmentable sin pasar el contexto a mano por cada componente.

Si el experimento está pausado o el visitante llega sin cookie, se sirve el
contenido por defecto que está en el código.

### Sobre probar precios

Mostrar precios distintos a personas distintas **al mismo tiempo** obliga a
informarlo (Directiva UE 2019/2161 sobre precio personalizado) y destruye la
confianza en cuanto un cliente comparte un pantallazo — y lo comparte.

La alternativa segura es **secuencial**: cambia el precio para todo el mundo
durante un periodo y compáralo con el anterior. Pierdes control sobre la
estacionalidad, pero es defendible legal y comercialmente.

El motor acepta cualquier payload, así que técnicamente soporta el test
simultáneo de precio. La decisión de usarlo así es tuya, con esto sobre la mesa.

---

## 5. Certificados de finalización

Cuando el alumno completa **todas** las lecciones de un paquete se emite un
certificado con código público de verificación, visible en
`/certificado/<codigo>`.

La emisión vive en SQL (`issue_certificate_if_complete`) y no en la aplicación
porque la condición es una consulta de conjuntos: resolverla en el servidor evita
traerse el temario entero solo para contarlo. La función es idempotente y vuelve
a comprobar el acceso, así que llamarla al completar cada lección no tiene
efectos secundarios.

La página de verificación lee mediante `verify_certificate()`, una función
`security definer` que devuelve **solo** el nombre del titular, el paquete y la
fecha. Ni el email ni el identificador del usuario salen de la base de datos.

Es prueba social que se comparte sola: cada certificado publicado en redes es un
enlace a tu catálogo.
