# Traspaso a la sesión de Zephora · costo del bot de WhatsApp

**De:** sesión de PROYECTOAUTOMA1 (nube) · 19 nov 2026
**Para:** `ZC · Sesión 3 · Automatizaciones y Meta` (o la sesión ZC que tenga `proyecto-1` y el deploy de Netlify)
**Estado:** medición terminada. La implementación no ha empezado y necesita el visto bueno del dueño.

Este documento es autocontenido: no hace falta nada de la conversación en la que se midió.

---

## 1. Qué se midió y cómo

Workflow n8n `74TjEtDnn940jh9k` (**Zephora · Asesora de WhatsApp**, activo en producción).
Se leyeron 20 ejecuciones reales con `get_execution` (solo lectura, sin tocar nada). **15 llegaron al
modelo**; 5 salieron por `Ignorar mensaje viejo` con costo cero.

Los números salen del campo `tokenUsage` que n8n guarda por cada llamada al nodo `Claude`
(`@n8n/n8n-nodes-langchain.lmChatAnthropic` v1.5, modelo `claude-sonnet-5`, `maxTokensToSample: 1024`).
Precio aplicado: $3/M entrada, $15/M salida.

| exec | llamadas al modelo | tokens entrada | USD |
|---|---|---|---|
| 10123 | **5** | 210,099 | **0.644** |
| 9457 | 3 | 119,685 | 0.369 |
| 9446 | 3 | 117,778 | 0.358 |
| 10736 | 3 | 116,448 | 0.357 |
| 9454 | 2 | 69,902 | 0.213 |
| 9441 | 2 | 68,970 | 0.211 |
| 10746 | 2 | 68,886 | 0.211 |
| 10730 | 2 | 67,473 | 0.206 |
| 10075 | 1 | 22,705 | 0.072 |
| 10070 | 1 | 22,284 | 0.068 |
| 10733 | 1 | 20,903 | 0.066 |
| 10134 | 1 | 20,841 | 0.065 |
| 9163 | 1 | 20,603 | 0.065 |
| 10725 | 1 | 20,352 | 0.063 |
| 10117 | 1 | 20,319 | 0.063 |

**Por mensaje de clienta:** media $0.202 · mediana $0.206 · peor caso medido **$0.644**.
**Llamadas al modelo por mensaje:** media 1.93 · mediana 2 · máximo 5.

Dos poblaciones, muy estables por dentro:

- **Sin llamar a `disponibilidad`** (7 de 15): 21,144 tokens de media, rango 20,319–22,705 → **$0.065**
- **Llamando a `disponibilidad`** (8 de 15): 104,905 de media, rango 67,473–210,099 → **$0.21 a $0.64**

### Salvedades honestas

- Son 15 muestras, no 20–30. Se paró ahí porque la varianza dentro de cada población es ±5%.
- Las ejecuciones se eligieron por duración entre las 120 más recientes. Las corridas largas
  correlacionan con más llamadas al modelo, así que **el 1.93 puede estar algo alto**. Que 5 de las 20
  resultaran salidas de costo cero sugiere que el sesgo no es grave, pero existe.
- La atribución del piso de 20,300 tokens (abajo, punto 2b) es **estimación**, no medición:
  n8n solo reporta `estimatedTokens` de los mensajes y lo calcula con caracteres÷4, que subcuenta
  el español.

---

## 2. La causa

### 2a. El catálogo se carga una vez y se arrastra en cada iteración

En la ejecución 10123 las cinco llamadas al modelo fueron, en tokens de entrada:

```
20,562  →  46,766  →  47,022  →  47,703  →  48,046
```

El salto está **solo entre la primera y la segunda: +26,204 tokens**. Ese salto es la respuesta de
`disponibilidad`: **53,352 caracteres**, el catálogo entero. De ahí en adelante crece 250–680 por
llamada, que son `enviar_foto` y similares — baratos.

O sea: el catálogo no se paga una vez por mensaje. **Se paga una vez por cada llamada posterior al
modelo dentro del mismo mensaje.** Cinco llamadas = se paga cuatro veces.

`netlify/functions/disponibilidad.mjs` son 187 líneas y **no acepta ningún parámetro**: siempre
devuelve el catálogo completo (todas las `piezas` y todos los `brazaletes`), tanto si la clienta
preguntó por un charm de Marvel como si pidió el catálogo entero.

### 2b. El piso de 20,300 tokens por llamada no es solo el prompt

El prompt del sistema son 40,230 caracteres de español → ~13,400 tokens reales. Los otros
**~6,900** son los esquemas de las 7 herramientas más el andamiaje del agente de LangChain, y
también se reenvían en **cada** iteración.

### 2c. Y el caché no se puede activar

`lmChatAnthropic` v1.5 es la última versión en esa instancia de n8n y **no expone ninguna opción de
caché** (se verificó con `get_node_types` con y sin versión; las opciones son solo
`maxTokensToSample`, `temperature`, `topK`, `topP`, `thinking`, `thinkingBudget`, `thinkingMode`,
`effort`, `streaming`). Para cachear habría que reemplazar el agente de LangChain por llamadas HTTP
directas y reconstruir el bucle de herramientas a mano: es reescribir un bot que está vendiendo.
No es el camino.

---

## 3. Lo que hay que hacer, en orden

### Paso 1 — `disponibilidad` acepta filtro (esta sesión, la de Zephora)

**Archivo:** `netlify/functions/disponibilidad.mjs`

**Regla que no se rompe: sin parámetros, la respuesta tiene que ser byte a byte la de hoy.**
Así nada se rompe mientras el nodo de n8n todavía no manda nada.

Parámetros propuestos (todos opcionales, se combinan con O lógico):

| parámetro | ejemplo | qué hace |
|---|---|---|
| `grupo` | `?grupo=Marvel` | solo ese grupo. Tamaños reales en `catalogo.json`: Símbolos 39, Marvel 16, Disney 15, Zodiaco 12, Anillos 12, Profesiones 8, Pixar 5, Clips 4, Cadenas 3, Muranos 3, Letras 1 (+ brazaletes, que se deducen en `grupoDe`). El grupo más grande son 39 piezas ≈ 6 KB en vez de 52 KB. |
| `ids` | `?ids=letra-m,mickey-mouse` | solo esos ids, tal cual los devuelve la función |
| `q` | `?q=libelula` | busca en `nombre` y `grupo`, sin tildes y sin distinguir mayúsculas |
| `tipo` | `?tipo=brazalete` | solo `piezas` o solo `brazaletes` |

Y en la respuesta, dos campos nuevos para que el modelo sepa que recibió un subconjunto:

```js
total: <piezas+brazaletes en el catálogo completo>,
devueltas: <cuántas van en esta respuesta>,
filtro: { grupo, ids, q, tipo },   // lo que se aplicó, o null
```

**Tope duro:** si el filtro deja más de 40 resultados, recortar a 40 y marcar `recortado: true`.
Sin tope, un `q` muy abierto recarga el catálogo entero y volvemos al punto de partida.

**Lo que no se toca:** `reglas`, `fuente`, `aviso` y el comportamiento de `solo-conteo` cuando Blobs
no responde. Esos tres campos van siempre, con filtro o sin él. El comentario de cabecera del
archivo explica por qué la resta de inventario vive en el servidor: eso sigue igual, solo se filtra
la salida.

**Pruebas antes de desplegar** (`pruebas/` ya tiene el patrón):

1. Sin parámetros → la respuesta es idéntica a la de producción (comparar JSON contra
   `curl https://zephoracharms.com/.netlify/functions/disponibilidad`).
2. `?grupo=Marvel` → 16 piezas, todas con `grupo: "Marvel"`, y `reglas`/`fuente`/`aviso` presentes.
3. `?ids=letra-m` → una pieza, `devueltas: 1`, `total` con el número completo.
4. `?q=LIBELULA` y `?q=libélula` → el mismo resultado (sin tildes, sin mayúsculas).
5. `?grupo=NoExiste` → 200 con listas vacías y `devueltas: 0`, **no** un 404 ni un 500: el prompt
   tiene que poder decir «no encontré eso» sin que el bot vea un error.
6. Un filtro que deja >40 → 40 resultados y `recortado: true`.
7. Con Blobs caído (simulado) y filtro → `fuente: 'solo-conteo'`, sin campo `disponible`.

**Medir el tamaño de la respuesta** en cada caso y anotarlo: es el número que decide si esto sirvió.
Hoy son 53,352 caracteres.

### Paso 2 — el nodo de n8n (lo hace la sesión de PROYECTOAUTOMA1)

Esto es importante y **va después del paso 1, nunca antes**.

El nodo `disponibilidad` (`n8n-nodes-base.httpRequestTool` v4.5, id
`a1c7b6ce-46fc-460f-a454-7cbba633ac55`) hoy es un GET pelado:

```json
{ "url": "https://zephoracharms.com/.netlify/functions/disponibilidad",
  "options": { "timeout": 10000 } }
```

**No tiene `toolDescription`.** El modelo sabe qué hace solo por el nombre del nodo y por lo que dice
el prompt. Así que el cambio no es «añadir un parámetro»: hay que **crear** la descripción de la
herramienta con un `$fromAI`, igual que ya hace `armar_carrito`. La sesión de PROYECTOAUTOMA1 tiene
acceso de escritura a n8n por MCP y la línea base medida para comparar después, así que lo toma ella.

El riesgo real está acá, no en la función: **si la descripción queda mal redactada, el bot deja de
encontrar piezas y se pierden ventas el mismo día.** Por eso el orden es: función desplegada y
probada contra producción → descripción del nodo → volver a medir. Y la descripción tiene que decir
explícitamente que **sin filtro devuelve todo**, para que el bot tenga salida cuando no sepa qué
filtrar.

### Paso 3 — volver a medir (sesión de PROYECTOAUTOMA1)

Mismo método, 15–20 ejecuciones nuevas, y comparar contra esta tabla. Sin esto no sabemos si sirvió.

---

## 4. Cuánto baja

Con el filtro (26,200 → ~1,700 tokens por respuesta):

| | mensaje de 2 llamadas | de 3 | de 5 | conversación de 8 mensajes |
|---|---|---|---|---|
| hoy | $0.201 | $0.349 | $0.630 | **$1.58** |
| solo filtro | $0.127 | $0.202 | $0.336 | **$1.03** |
| filtro + prompt a 5k | $0.077 | $0.118 | $0.191 | **$0.46** |

**El filtro solo baja un 35%.** No más, porque una vez quitado el catálogo lo que domina es el piso
de 20,300 que se reenvía en cada iteración. La segunda palanca es adelgazar el prompt moviendo las
tablas de referencia (los 8 kits, novedades, la tabla de tallas de anillos) a una herramienta que se
consulte cuando haga falta. **Eso es un trabajo aparte y más delicado**, porque esas secciones del
prompt están escritas a raíz de errores reales del bot. No va en este traspaso.

---

## 5. Por qué importa más allá de Zephora

$300.000 COP/mes (~$70 USD) cubre hoy **~44 conversaciones**. Con filtro, ~68. Con filtro más prompt
adelgazado, ~150. Una tienda que vende de verdad hace más de 150 conversaciones al mes.

Para el proyecto de agencia esto significa dos cosas concretas:

1. El precio recurrente del Nivel 3 tiene que subir, o la oferta tiene que llevar escrito un tope de
   conversaciones al mes.
2. Saber construir un agente de WhatsApp a $0.05 por conversación en vez de $0.20 por **mensaje** es
   en sí mismo la ventaja competitiva. Nadie que venda bots a tiendas está midiendo esto.

---

## 6. Lo que necesita el visto bueno del dueño

- Desplegar `disponibilidad.mjs` a producción (`zephoracharms.com`). El `CLAUDE.md` de `proyecto-1`
  lo pide explícitamente.
- Tocar el nodo `disponibilidad` del workflow activo. Es el paso con riesgo de perder ventas el
  mismo día si la descripción queda mal.

El paso 1 se puede escribir y probar entero **sin desplegar**. Lo que no se debe hacer sin
aprobación es publicar.

---

## 7. Reparto

| | quién | por qué |
|---|---|---|
| `disponibilidad.mjs` + pruebas + deploy | sesión de Zephora | tiene el repo y el deploy de Netlify |
| `toolDescription` del nodo + `$fromAI` | sesión de PROYECTOAUTOMA1 | tiene escritura en n8n por MCP |
| volver a medir y comparar | sesión de PROYECTOAUTOMA1 | tiene la línea base y el método |
| aprobar el deploy y el cambio del nodo | el dueño | tienda en producción vendiendo |

Si la sesión de Zephora prefiere que el parche de `disponibilidad.mjs` se escriba desde la sesión de
PROYECTOAUTOMA1, se puede: `proyecto-1` está clonado en ese contenedor en
`/home/user/zephoracharmsmanagement-hue/proyecto-1` (HEAD `02f6e89`). Pero las pruebas y el deploy es
mejor que corran donde siempre.
