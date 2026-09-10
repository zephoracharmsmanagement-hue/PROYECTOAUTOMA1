# Pagos con Stripe

## Configuración inicial

### 1. Productos y precios

En el Dashboard de Stripe (modo test primero):

**Por cada paquete de pago único**

1. Products → Add product → nombre del paquete.
2. Pricing model: _One-off_. Importe y moneda.
3. Copia el `price_...` y guárdalo en `packages.stripe_price_id_one_time`.

**Por cada plan de membresía**

1. Products → Add product → "All Access".
2. Añade dos precios recurrentes: mensual y anual.
3. Copia cada `price_...` a la fila correspondiente de `plans.stripe_price_id`.

```sql
update public.packages
   set stripe_price_id_one_time = 'price_1AbC...'
 where slug = 'dropshipping-cero-a-venta';

update public.plans
   set stripe_price_id = 'price_1XyZ...'
 where slug = 'all-access-mensual';
```

### 2. Webhook

**Local**

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copia el whsec_… a STRIPE_WEBHOOK_SECRET en .env.local
```

**Producción** — Developers → Webhooks → Add endpoint
→ `https://tudominio.com/api/webhooks/stripe`, con estos eventos:

| Evento                          | Efecto                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `checkout.session.completed`    | Registra la orden, concede los entitlements y anota la comisión de afiliado       |
| `checkout.session.expired`      | Marca el carrito como abandonado y envía el email de recuperación                 |
| `customer.subscription.created` | Alta de membresía                                                                 |
| `customer.subscription.updated` | Cambio de estado, plan o renovación                                               |
| `customer.subscription.deleted` | Revoca la membresía                                                               |
| `invoice.paid`                  | Registra el ingreso recurrente, cierra el dunning y genera comisión de renovación |
| `invoice.payment_failed`        | Dunning: escala el aviso según el número de intento                               |
| `charge.refunded`               | Revoca **todo** lo que traía la orden reembolsada                                 |
| `charge.dispute.created`        | Revoca lo disputado                                                               |

Sin `invoice.paid` no hay MRR ni LTV reales: los pagos recurrentes no quedarían
registrados en ninguna parte, y las comisiones de afiliado sobre renovaciones no
se generarían. Sin `checkout.session.expired` no hay recuperación de carritos
abandonados. Los nueve son necesarios.

Copia el signing secret a `STRIPE_WEBHOOK_SECRET`.

## Flujo de compra

```
1. Usuario pulsa comprar
2. POST /api/checkout  { kind: 'package', slug: 'xxx' }
      ├─ ¿hay sesión?          → si no: 401 → el cliente redirige a /login
      ├─ resuelve price_id en la BD a partir del slug   ← el precio NO viaja
      ├─ ¿ya tiene el paquete? → 400 "Ya tienes acceso"
      └─ crea la sesión de Checkout con metadata { user_id, package_id }
3. Stripe cobra
4. Webhook checkout.session.completed
      ├─ registra el evento (idempotencia)
      ├─ upsert en orders   (clave: checkout_session_id)
      └─ upsert en entitlements  (clave: user_id + package_id)
5. El usuario vuelve a /checkout/exito, que solo informa
```

**El paso 5 nunca concede acceso.** Si el usuario cierra el navegador tras pagar,
el paso 4 ya lo dejó todo correcto.

## Idempotencia

Tres capas independientes:

1. `webhook_events.stripe_event_id` único → un evento se procesa una sola vez.
2. `orders.stripe_checkout_session_id` único → `upsert` en lugar de `insert`.
3. Índices únicos parciales en `entitlements` → nunca dos concesiones vivas del
   mismo derecho.

## Estados de suscripción

| Estado de Stripe                           | ¿Da acceso? | Motivo                                                                    |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------------- |
| `trialing`                                 | Sí          | Periodo de prueba                                                         |
| `active`                                   | Sí          | Al día                                                                    |
| `past_due`                                 | Sí          | Cobro fallido con reintentos en curso: cortar aquí genera bajas evitables |
| `canceled`, `unpaid`, `incomplete_expired` | No          | Se revoca                                                                 |

Definido en `GRANTING_STATUSES` (`src/lib/stripe/webhook-handlers.ts`).

Al cancelar, Stripe mantiene `active` con `cancel_at_period_end = true` hasta el
final del periodo; el acceso se conserva porque `expires_at` apunta a esa fecha.

## Pruebas

```bash
# Tarjeta de prueba: 4242 4242 4242 4242, cualquier fecha futura, cualquier CVC
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger charge.refunded
```

Comprobaciones recomendadas antes de abrir ventas:

- [ ] Compra de paquete → aparece en `/dashboard` en menos de 10 s
- [ ] Segunda compra del mismo paquete → bloqueada con mensaje claro
- [ ] Alta de suscripción → desbloquea todo el catálogo
- [ ] Cancelación → el acceso sobrevive hasta el fin del periodo
- [ ] Reembolso → el acceso desaparece
- [ ] Webhook con firma inválida → 400 y ningún cambio en la base de datos
