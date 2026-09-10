# Producto: rutas de aprendizaje y automatizaciones

Fase 4, primera mitad. El asistente con IA y la versión en inglés van aparte.

---

## Rutas de aprendizaje

Una ruta encadena varios paquetes en el orden que tiene sentido implementarlos y
**se vende como lote**. Se gestionan en `/admin/rutas`; el público las ve en
`/rutas`.

### Cómo se concede el acceso

Comprar una ruta concede acceso a **todos** sus paquetes de una vez. No hizo
falta un tipo de acceso nuevo: el modelo de entitlements ya soportaba varios
paquetes por orden desde los order bumps, así que la ruta reutiliza exactamente
esa vía — una sola línea de cobro en Stripe, varios `order_items` y varios
entitlements.

`orders.path_id` deja la traza de qué orden compró qué ruta.

### Decisiones que impone el código

- **Precio único, sin prorrateo.** Si el cliente ya tiene alguno de los paquetes,
  la ruta se lo concede igualmente pero no descuenta nada. La ficha se lo dice
  con claridad (_"ya tienes 2 de 4; quizá te salga mejor comprar los que te
  faltan"_) en lugar de dejar que lo descubra al pagar. Si ya los tiene todos, la
  compra se bloquea.
- **El ahorro se calcula, no se afirma.** La ficha compara el precio del lote con
  la suma real de los paquetes que lo componen. Si no hay ahorro, no se anuncia
  ninguno.
- **Una ruta publicada necesita al menos dos paquetes** y, si tiene precio, su
  `price_id` de Stripe. Una ruta de un solo paquete no es una ruta, y un lote sin
  precio real es un botón de compra roto.
- **No se borra una ruta con ventas**: se archiva, igual que los paquetes.

### Composición

Los paquetes de la ruta se editan como texto, uno por línea y en orden:

```
dropshipping-cero-a-venta | Primero valida el producto y monta la tienda.
automatizacion-whatsapp-ventas | Cuando ya entran pedidos, automatiza la atención.
escalado-ads-ecommerce | Con el sistema en pie, escala el tráfico.
```

Guardar reemplaza la composición entera, así que el orden del textarea es la
fuente de verdad y no quedan filas huérfanas.

---

## Automatizaciones instalables

Flujos de n8n, Make o Zapier que el alumno importa en su propia cuenta. Se
gestionan en `/admin/automatizaciones`.

### Son contenido de pago

El JSON del flujo se sirve por `/api/automations/<id>/download`, que usa el
cliente del propio usuario: la política `automations_select_entitled` ya limita
la lectura a quien tiene acceso al paquete. Si no lo tiene, la consulta no
devuelve fila y la respuesta es un 404 — que además no revela si el recurso
existe.

La ficha de venta sí lista **qué** automatizaciones incluye el paquete (nombre,
plataforma y credenciales necesarias) sin entregar el flujo, mediante
`automation_catalog()`. Es argumento de venta sin regalar el producto.

### La comprobación de credenciales

El error más caro y más fácil de cometer con esto es exportar un flujo **con las
claves dentro** y repartirlo a todos los alumnos. Al guardar, el formulario busca
patrones de credencial conocidos (`sk-…` de OpenAI, `sk_live_…` de Stripe,
`sk-ant-…` de Anthropic, `AIza…` de Google, `xox…` de Slack, `ghp_…` de GitHub,
tokens OAuth) y rechaza el guardado nombrando lo que ha encontrado.

**No es un detector infalible y no debe tratarse como tal.** Es una red de
seguridad; la responsabilidad de exportar limpio sigue siendo de quien sube el
flujo. Por eso el aviso está también en la propia pantalla.

### Dónde aparecen

- Con `lesson_id`: dentro de esa lección, además de en el paquete.
- Sin `lesson_id`: solo en la página del paquete en la biblioteca.

El campo `requires` lista las credenciales que el alumno debe conectar por su
cuenta, y se muestra antes de la descarga para que sepa qué va a necesitar.
