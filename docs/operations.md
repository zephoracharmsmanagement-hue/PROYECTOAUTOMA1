# Operación: métricas, dunning, afiliados y comunidad

Las cuatro piezas de la Fase 3. Todas viven en el panel y ninguna necesita
configuración externa más allá de suscribir dos eventos nuevos de Stripe
(`invoice.paid` y `checkout.session.expired`, ver `payments.md`).

---

## 1. Métricas de negocio

`/admin/metricas`. Todo se calcula en SQL de una pasada
(`admin_business_metrics`): traerse las filas para agregarlas en la aplicación
sería más lento y no escalaría con el histórico.

### Qué mide cada número

| Métrica                    | Definición exacta                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **MRR**                    | Suma de las suscripciones `active` + `trialing`, con los planes anuales prorrateados a mes (precio ÷ 12) |
| **ARR**                    | MRR × 12                                                                                                 |
| **Churn mensual**          | Suscripciones canceladas en 30 días ÷ (activas + canceladas) al inicio del periodo                       |
| **ARPU**                   | Ingresos acumulados totales ÷ clientes con acceso activo                                                 |
| **LTV**                    | ARPU ÷ tasa de cancelación mensual                                                                       |
| **Conversión por paquete** | Checkouts **pagados** ÷ checkouts **iniciados**                                                          |

### Dos honestidades que trae incorporadas

**El tamaño de muestra.** Con 5 suscriptores, perder uno es un churn del 20%: el
número es correcto y no significa nada. Por debajo de 20 suscripciones el panel
atenúa el churn y el LTV y lo dice explícitamente. Sirven para ver una tendencia
gruesa, no para decidir precios.

**La conversión es de checkout, no de visita.** No hay datos propios de
pageviews: la landing va cacheada y las visitas viven en tu proveedor de
analítica. En lugar de inventar una métrica, se mide _checkout iniciado →
pagado_, que es exacta desde que las órdenes se registran como `pending`, y
además es más accionable: apunta a fricción en el pago, no a tráfico frío.

Para visita → compra, cruza `begin_checkout` y `purchase_confirmed` en Plausible
o GA4 (ver `growth.md`).

### El gráfico

Columnas apiladas de ingresos mensuales: pago único y suscripción. La paleta
(`#0ea86a` / `#7c6cf6`) está validada contra la superficie oscura del panel —
separación para daltonismo ΔE 25.0 (deuteranopía) y 9.4 (tritanopía), contraste
sobre fondo ≥ 3:1 — y la identidad nunca depende solo del color: hay leyenda,
tooltip y una vista de tabla desplegable con los mismos datos.

---

## 2. Dunning: recuperar pagos fallidos

Stripe ya reintenta el cobro. Lo que faltaba es el lado humano.

### La escalada

El número de intento lo trae la propia factura (`invoice.attempt_count`), así que
**no hace falta ningún proceso programado**: cada reintento de Stripe dispara el
aviso que le toca.

| Intento | Tono                                                                      |
| ------- | ------------------------------------------------------------------------- |
| 1       | Tranquilizador: "suele ser una tarjeta caducada, lo reintentaremos solos" |
| 2       | Directo: "actualiza el método de pago o date de baja, sin penalización"   |
| 3+      | Último aviso antes de pausar el acceso                                    |

Tres niveles y para. Insistir más allá del tercero no recupera pagos: genera
bajas y quejas.

### El periodo de gracia

`subscriptions.grace_until` mantiene el acceso durante los reintentos. Cortar en
el primer fallo convierte en baja a alguien que solo tenía la tarjeta caducada.

Además del email, quien entra a `/dashboard` ve un aviso con enlace directo al
portal de facturación — mucha gente no lee los correos pero sí entra a la
plataforma. El mensaje dice explícitamente que el acceso sigue activo: asustar no
acelera el pago.

Un `invoice.paid` correcto borra los intentos acumulados y el periodo de gracia.

---

## 3. Programa de afiliados

`/admin/afiliados` para gestionarlo; `/afiliados` es el panel del propio afiliado.

### Atribución

1. El afiliado reparte enlaces con `?ref=SU_CODIGO` (vale en cualquier página, no
   solo la portada).
2. El middleware guarda el código en cookie durante **90 días** (criterio
   _last-click_, el habitual del sector y el más fácil de explicar).
3. En el primer checkout, la atribución se **fija en el perfil del cliente**. A
   partir de ahí sus renovaciones siguen generando comisión aunque la cookie
   caduque.

Un afiliado nunca cobra comisión por su propia compra.

### Comisiones

Se generan sobre pagos únicos (incluidos bumps y upsells) y sobre **cada factura
de suscripción pagada**, no solo la primera.

`referrals.stripe_reference` es único, así que un reintento de webhook no puede
duplicar una comisión.

El ciclo es `pending → approved → paid`, con `void` para anular. **Aprobar y
pagar son decisiones humanas a propósito**: mientras corre el periodo de
garantía, una venta todavía puede devolverse, y una comisión pagada sobre una
venta reembolsada no se recupera.

Los pagos se hacen **fuera de la plataforma** (transferencia, PayPal, Wise). El
panel lleva la cuenta de lo que se debe y marca lo liquidado. Integrar Stripe
Connect para pagos automáticos es un proyecto en sí mismo y no compensa hasta
tener un volumen que lo justifique.

---

## 4. Q&A para miembros

Preguntas por paquete y, opcionalmente, por lección. Aparecen bajo el reproductor
en `/biblioteca/<paquete>/<leccion>`; se moderan en `/admin/preguntas`.

### Acceso

Las políticas RLS reutilizan `has_package_access`: **la misma regla que protege
el contenido protege la conversación**. Las Server Actions no vuelven a
comprobarlo, precisamente para no crear una segunda definición de "tener acceso"
que se acabe desincronizando; cuando la política rechaza una inserción, el error
`42501` se traduce a un mensaje humano.

### El choque con RLS que hubo que resolver

`profiles` solo es legible por su dueño, así que un miembro no podía ver el
nombre de quien pregunta. Lo resuelve `package_thread()`, una función
`security definer` que revalida el acceso al paquete y devuelve **solo** el
nombre visible del autor. Si no hay nombre completo se usa la parte local del
email — nunca el email entero, que en un hilo entre miembros sería una fuga de
dato personal y un imán para el spam.

### Moderación

- **Respuesta del equipo**: se destaca visualmente y marca la pregunta como
  resuelta. El distintivo lo concede la política de inserción (`is_staff` solo se
  acepta de un admin), no la interfaz.
- **Ocultar** una pregunta la retira para el resto; su autor la sigue viendo.
- El autor puede corregir su pregunta pero no cambiarle el estado ni moverla de
  paquete: la política `with check` lo impide.
