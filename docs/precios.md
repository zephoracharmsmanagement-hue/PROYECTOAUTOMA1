# Estudio de precios · 21 de noviembre de 2026

Decisión del dueño: **la agencia arranca con precios económicos para atraer clientes**, sin caer en
que «barato» se lea como «malo». Este documento reemplaza la escalera de precios del §6 de
`docs/estrategia-agencia.md`, que estaba pensada más arriba.

Todos los precios son **propuestas** y están en COP. Las anclas de mercado salen de
`docs/investigacion-competencia.md` y de la segunda investigación (§12 de la estrategia): son
extractos del buscador, no páginas abiertas.

---

## 1. La idea central: económico porque está automatizado, no porque hagamos menos

El cliente tiene que entender **por qué** cobramos menos, o va a suponer que es peor. La razón es
real: el crawler audita una tienda en minutos, los creativos salen de generadores que ya existen y
el trabajo repetitivo lo hace la IA. La frase para la página:

> **Cobramos menos porque automatizamos lo repetitivo, no porque hagamos menos.**

Con eso, el precio bajo se vuelve una prueba de lo que vendemos (eficiencia), no una señal de
calidad baja.

---

## 2. Contra qué se compara nuestro precio

El dueño de una tienda contraentrega no compara nuestro precio con otras agencias: lo compara con
**lo que pierde cada mes**. Ejemplo ilustrativo, con las cifras de mercado:

| Supuesto | Valor |
|---|---|
| Pedidos al mes | 300 |
| Pedidos que no se entregan | 30 % → 90 pedidos |
| Costo logístico de cada devolución | 15.000–35.000 |
| Pauta pagada por cada pedido perdido | 15.000–45.000 |
| **Pérdida al mes** | **2,7 a 7,2 millones** |

Al lado de eso, una puesta a punto de 590.000 o un plan de 290.000 al mes son poca plata. **Toda la
comunicación de precios se ancla en esta cuenta**, hecha con los números de cada tienda en el
diagnóstico.

---

## 3. Anclas de mercado

| Servicio | Rango que cobra el mercado |
|---|---|
| Auditoría técnica de tienda | 800.000–2.500.000 (agencia colombiana); 200.000–4.000.000 (freelancers) |
| Arreglo de pixel / API de conversiones | 400.000–1.600.000 (freelancers) |
| Bot de WhatsApp gestionado | setup 420.000–5.400.000; mensualidad 299.000–1.400.000 |
| SaaS de WhatsApp con IA | desde 19.900 hasta ~1.600.000 al mes |
| Video UGC | 90.000–850.000 por video; agencias UGC desde 1.400.000 al mes |
| Mentoría de dropshipping | ~990.000 por 10 sesiones |

---

## 4. La escalera económica (propuesta)

| Escalón | Producto | Alcance cerrado | Precio de lista | Precio fundador (5 primeros) | Frente al mercado |
|---|---|---|---|---|---|
| 0 | **Diagnóstico de fugas** | Video de 90 s + cuenta de cuánto pierde la tienda | Gratis | — | Gancho; nadie lo hace con evidencia |
| 1 | **Arreglo exprés del pixel** | Eventos faltantes o duplicados, informe de antes y después, en 48 h | 390.000 | 290.000 | Por debajo del piso de freelancers (400.000) |
| 2 | **Puesta a punto** | Pixel + peso de la tienda + WhatsApp + reseñas + contraentrega visible, en 72 h | 990.000 | 590.000 | Por debajo del piso de agencia (800.000) |
| 3 | **Plan de operación** (mensual) | Monitoreo mensual con el crawler + tablero de utilidad + señal de entrega a Meta | 390.000 + variable | 290.000 + variable | Mensualidades de 299.000–1.400.000 |
| 4 | **Creativos** (mensual) | 4 videos con voz + 8 imágenes al mes | 490.000 | 390.000 | Un solo video UGC cuesta 90.000–850.000 |

**El escalón 1 es la puerta.** Un producto chico, rápido y barato convierte a un desconocido en
cliente con poco riesgo para él. Quien ve su pixel arreglado en 48 horas con un informe de antes y
después, compra la puesta a punto. Así se es económico sin rebajar el producto central.

### El variable del plan mensual
Una base fija más **5.000 COP por cada pedido entregado por encima de la línea base** de la tienda
(su tasa de entrega antes de empezar, sacada de sus datos de Dropi).

Ejemplo: tienda de 300 pedidos que pasa de 65 % a 72 % de entrega → 21 pedidos entregados más al mes
→ 105.000 de variable. Esos 21 pedidos le valen a la tienda varias veces eso. Si no mejora, paga
solo la base. **Es una hipótesis**: hay que probar primero en nuestras tiendas que la mejora existe
y cuánto es, antes de ofrecerlo.

### El vendedor IA por WhatsApp
El precio cerrado antes (1.500.000 de setup + 300.000 al mes) choca con la nueva línea económica y
con un mercado donde el setup arranca en 420.000 y Dropi ya trae el suyo. **Propuesta:** no
venderlo aislado; incluirlo como complemento del plan de operación para quien lo necesite.
**Lo decide el dueño**, porque ese precio lo fijó él.

---

## 5. Cómo no parecer baratos

1. **Precio de lista visible siempre**, y el precio fundador al lado, con su razón: «para los cinco
   primeros, a cambio de publicar su caso con números». Se ve que el precio real es otro.
2. **Alcance cerrado y nombre propio.** «Arreglo exprés del pixel en 48 h» se lee como un producto;
   «te hago lo del pixel» se lee como un favor barato.
3. **Garantía sobre lo que controlamos.** «Si después del arreglo tu pixel no reporta los eventos,
   te devolvemos el dinero.»
4. **Informe de antes y después en cada trabajo.** Es la prueba de profesionalismo.
5. **Nunca rebajar a pedido.** Si alguien pide descuento, se le ofrece el escalón de abajo, no una
   rebaja.
6. **No competir con el bot de 20.000.** No somos un bot.

---

## 6. Lo que hay que medir con los primeros cinco clientes

El piso real del precio depende de datos que todavía no tenemos:

| Dato | Para qué |
|---|---|
| Horas reales por trabajo (arreglo de pixel, puesta a punto, mes de plan) | Saber si el precio cubre el tiempo |
| Costo real de herramientas por trabajo (Kie, ElevenLabs, n8n) | El costo variable |
| Costos fijos al mes (plan de Claude, ElevenLabs, Netlify, dominio, n8n) | Repartirlos entre los clientes |
| Cuántos aceptan el escalón 1 después del diagnóstico | Si el precio de entrada funciona |
| Cuántos pasan del escalón 1 al 2 y del 2 al 3 | Si la escalera funciona |

**Fórmula del precio mínimo de cada trabajo:**
`costos fijos del mes ÷ trabajos del mes + costo de herramientas del trabajo + horas × valor de tu hora`

### Cuánto volumen pide este modelo (ilustrativo)
Para facturar 5.000.000 al mes con precio fundador:
- 4 puestas a punto (2.360.000) + 6 arreglos de pixel (1.740.000) + 3 planes (870.000 de base) ≈ **4.970.000**.
- Si una puesta a punto toma 6 horas y un arreglo 2, son unas 36 horas de trabajo de entrega al mes,
  más el tiempo de los planes mensuales y la prospección. Es viable para una persona con estas herramientas. **Las horas son supuestas:
  medirlas con los primeros clientes.**

Cuando se acaben los cinco cupos de fundador, los precios suben a los de lista sin anunciarlo como
alza: el precio de lista ya estaba publicado desde el primer día.
