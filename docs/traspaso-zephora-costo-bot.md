# Traspaso a la sesión de Zephora · costo del bot de WhatsApp

**De:** sesión de PROYECTOAUTOMA1 (nube) · 19 nov 2026
**Para:** `ZC · Sesión 3 · Automatizaciones y Meta` (o la sesión ZC que tenga `proyecto-1` y el deploy de Netlify)
**Estado:** medición terminada. La implementación no ha empezado y necesita el visto bueno del dueño.

> **Revisión 2 — 19 nov 2026.** La revisión 1 pedía cuatro parámetros (`grupo`, `ids`, `q`, `tipo`).
> **Quedan dos: `grupo` e `ids`.** `q` se retiró porque es una regresión, no una optimización
> (ver 3.1); `tipo` porque es redundante. Se añadieron dos requisitos que faltaban (normalizar
> tildes, vacío = ausente), se corrigieron los tamaños de grupo, y **adelgazar el prompt pasó de
> «trabajo aparte» a ser la palanca principal** (ver 2d y 3.4). Si empezaste con la revisión 1,
> lee 3.1 y 2d antes de seguir.
>
> **Revisión 3 — 19 nov 2026, 16:40 UTC. Corrección de precio.** Las revisiones 1 y 2 calcularon
> todo a $3 / $15 por millón de tokens, que es el precio de **Sonnet 4.6**. El bot corre
> `claude-sonnet-5`, que cuesta **$2 / $10**. Todas las cifras en dólares de este documento estaban
> **infladas un 33%** y quedan corregidas abajo. Los **porcentajes y la jerarquía de palancas no
> cambian**, porque son razones entre cifras que escalaban igual. Añadida también la sección 8 con
> la primera medición después de desplegar.

Este documento es autocontenido: no hace falta nada de la conversación en la que se midió.

---

## 1. Qué se midió y cómo

Workflow n8n `74TjEtDnn940jh9k` (**Zephora · Asesora de WhatsApp**, activo en producción).
Se leyeron 20 ejecuciones reales con `get_execution` (solo lectura, sin tocar nada). **15 llegaron al
modelo**; 5 salieron por `Ignorar mensaje viejo` con costo cero.

Los números salen del campo `tokenUsage` que n8n guarda por cada llamada al nodo `Claude`
(`@n8n/n8n-nodes-langchain.lmChatAnthropic` v1.5, modelo `claude-sonnet-5`, `maxTokensToSample: 1024`).
Precio aplicado: **$2/M entrada, $10/M salida** (`claude-sonnet-5`, precio verificado el 19-nov).

| exec | llamadas al modelo | tokens entrada | USD |
|---|---|---|---|
| 10123 | **5** | 210,099 | **0.429** |
| 9457 | 3 | 119,685 | 0.246 |
| 9446 | 3 | 117,778 | 0.239 |
| 10736 | 3 | 116,448 | 0.238 |
| 9454 | 2 | 69,902 | 0.142 |
| 9441 | 2 | 68,970 | 0.141 |
| 10746 | 2 | 68,886 | 0.141 |
| 10730 | 2 | 67,473 | 0.137 |
| 10075 | 1 | 22,705 | 0.048 |
| 10070 | 1 | 22,284 | 0.046 |
| 10733 | 1 | 20,903 | 0.044 |
| 10134 | 1 | 20,841 | 0.043 |
| 9163 | 1 | 20,603 | 0.043 |
| 10725 | 1 | 20,352 | 0.042 |
| 10117 | 1 | 20,319 | 0.042 |

**Por mensaje de clienta:** media **$0.135** · mediana **$0.137** · peor caso medido **$0.429**.
**Llamadas al modelo por mensaje:** media 1.93 · mediana 2 · máximo 5.

Dos poblaciones, muy estables por dentro:

- **Sin llamar a `disponibilidad`** (7 de 15): 21,144 tokens de media, rango 20,319–22,705 → **$0.044**
- **Llamando a `disponibilidad`** (8 de 15): 104,905 de media, rango 67,473–210,099 → **$0.14 a $0.43**

Calibración que se usa en todo el resto del documento: **53,352 caracteres de respuesta = 26,204
tokens**, o sea **2.036 caracteres por token**. Es medido, no estimado. (Ojo: no son los 4 caracteres
por token de la heurística de n8n; el JSON con URLs y acentos tokeniza mucho más denso.)

### Salvedades honestas

- Son 15 muestras, no 20–30. Se paró ahí porque la varianza dentro de cada población es ±5%.
- Las ejecuciones se eligieron por duración entre las 120 más recientes. Las corridas largas
  correlacionan con más llamadas al modelo, así que **el 1.93 puede estar algo alto**. Que 5 de las 20
  resultaran salidas de costo cero sugiere que el sesgo no es grave, pero existe.
- La atribución del piso de 20,300 tokens (2b) es **estimación**, no medición.
- Las proyecciones de 2d y 4 salen de un modelo con 1.93 llamadas uniformes, que da $0.105 por
  mensaje contra los $0.135 medidos: el modelo no reproduce la cola de mensajes de 5 llamadas.
  **Los porcentajes son sólidos; los absolutos son modelo.**

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

### 2d. El piso domina: añadir una iteración arruina cualquier ahorro

Medido campo por campo, qué pesa dentro de los 26,204 tokens del catálogo:

| campo | % del payload | tokens |
|---|---|---|
| `foto` | **35.5%** | 8,776 |
| `material` | 12% | 2,961 |
| `nombre` | 9.7% | 2,387 |
| `id` | 8.1% | 2,011 |
| `grupo` | 6.1% | 1,498 |
| `familia` | 5.6% | 1,393 |
| `agotado` | 5.3% | 1,305 |
| `tipo` | 5.1% | 1,266 |
| `precio` | 5% | 1,229 |
| `disponible` | 4.3% | 1,061 |
| `tallas` | 2% | 497 |

`foto` es el campo más gordo y la tentación obvia es quitarlo —el nodo de n8n tiene
`optimizeResponse` + `fieldsToInclude: 'except'`, que lo haría sin tocar la función—.
**Es un error que sale 48% más caro.** El nombre del archivo no se deduce del id, así que sin ese
campo el modelo tiene que pedirlo en otra llamada, y **cada iteración extra cuesta el piso de
20,319 tokens**. Ahorras 8,776 para gastar 21,000.

De ahí la regla que ordena todo lo demás: **cualquier optimización que arriesgue una iteración extra
del agente es pérdida neta.** El piso, no el payload, es lo que manda.

Jerarquía real de palancas, con el modelo de 1.93 llamadas:

| palanca | baja | por qué |
|---|---|---|
| prompt de 13,400 → 5,000 tokens | **31%** | pega en **todas** las iteraciones y en **todos** los mensajes |
| filtrar por grupo | 19–23% | no añade iteraciones; 23% con Marvel, 19% con Símbolos |
| quitar `material` del nodo | 3% | gratis: son dos constantes y la info ya está en `tipo` |
| ~~quitar `foto` del nodo~~ | **−48%** | fuerza una iteración extra |

Y el dato que decide la prioridad: **47% de los mensajes nunca llaman a `disponibilidad`** (7 de 15
medidos). Para esos el filtro ahorra exactamente $0; el prompt ahorra $0.017 en cada uno.
Por eso el prompt subió a palanca principal.

---

## 3. Lo que hay que hacer, en orden

### 3.1 — `disponibilidad` acepta filtro (sesión de Zephora)

**Archivo:** `netlify/functions/disponibilidad.mjs`

**Regla que no se rompe: sin parámetros, la respuesta tiene que ser byte a byte la de hoy.**
Así nada se rompe mientras el nodo de n8n todavía no manda nada.

**Dos parámetros, los dos opcionales.** Se combinan con O lógico.

| parámetro | ejemplo | qué hace |
|---|---|---|
| `grupo` | `?grupo=Marvel` | solo ese grupo |
| `ids` | `?ids=letra-m,mickey-mouse` | solo esos ids, tal cual los devuelve la función |

**Grupos tal como los devuelve `grupoDe()`** —no como están en `catalogo.json`, que no coinciden—,
con el tamaño real de la respuesta ya simulado:

| grupo | piezas | caracteres | tokens | % de la respuesta completa |
|---|---|---|---|---|
| Símbolos | 39 | 12,306 | 6,044 | 24% |
| Letras | 27 | 7,521 | 3,694 | 15% |
| Brazaletes | 22 | 8,306 | 4,080 | 17% |
| Marvel | 16 | 4,982 | 2,447 | 10% |
| Disney | 15 | 4,458 | 2,189 | 9% |
| Zodiaco | 12 | 3,509 | 1,723 | 7% |
| Anillos | 12 | 4,298 | 2,111 | 9% |
| Profesiones | 8 | 2,763 | 1,357 | 5% |
| Pixar | 5 | 1,724 | 847 | 3% |
| Clips | 4 | 1,583 | 777 | 3% |
| Cadenas | 3 | 1,322 | 649 | 3% |
| Muranos | 3 | 1,261 | 619 | 3% |

Suman **166 ítems, que es el total de `stock.json`: ningún ítem queda sin grupo.** Verificado, no
supuesto. Filtrar por grupo nunca huérfana una pieza. `Letras` son 27 (no 1, que es lo que dice
`catalogo.json`: `grupoDe()` las deriva del prefijo `letra-`) y `Brazaletes` son 22 (los deriva de
`it.tallas`).

Un `?ids=` con 3 piezas son ~1,300 caracteres ≈ 640 tokens. El sobre fijo
(`reglas` + `fuente` + `aviso`, cero piezas) son 339 caracteres ≈ 167 tokens.

#### Lo que se retiró de la revisión 1, y por qué

**`q` (buscador de texto) — NO implementar. Es una regresión.**
El caso está documentado en el propio prompt: una clienta pide una «libélula» y la pieza se llama
*Luciérnaga Evangeline*. `?q=libelula` devuelve **cero**. El prompt entonces instruye al bot a
declararla agotada y anotarla con `anotar_reposicion`: **venta perdida y lista de reposición
contaminada con una pieza que sí existe.** Hoy eso funciona precisamente porque el modelo ve los
candidatos y hace el emparejamiento conceptual él mismo —el prompt se lo pide con esas palabras:
«busca por la IDEA, no por cómo está escrito el nombre»—. Un buscador literal se lo quita.
Un grupo, en cambio, trae **todas** sus piezas, así que el emparejamiento conceptual sigue
ocurriendo dentro del grupo. Esa es la diferencia.

**`tipo` — redundante.** `Brazaletes` ya es un grupo, así que `?grupo=Brazaletes` cubre el caso.
Dos parámetros en vez de cuatro es menos superficie de error para el modelo.

#### Dos requisitos que faltaban

1. **Normalizar tildes y mayúsculas al comparar `grupo`.** El grupo real es `Símbolos` **con tilde**,
   y el modelo va a mandar `Simbolos`. Comparación literal = cero resultados = el bot cree que no hay
   nada de Símbolos. Normaliza los dos lados (`NFD` y quitar diacríticos) antes de comparar.
2. **Un parámetro vacío cuenta como ausente.** `?grupo=&ids=` debe devolver lo mismo que sin
   parámetros. Así el nodo de n8n puede mandar siempre las dos claves sin romper el contrato, y no
   dependemos de que `$fromAI` sepa omitir una.

#### Campos nuevos en la respuesta

```js
total: <piezas+brazaletes en el catálogo completo>,   // 166 hoy
devueltas: <cuántas van en esta respuesta>,
filtro: { grupo, ids } | null,                        // lo que se aplicó
```

**Tope duro:** si el filtro deja más de 40 resultados, recortar a 40 y marcar `recortado: true`.
Hoy ningún grupo pasa de 39, así que el tope no se activa — está para que un `ids` largo o un grupo
futuro más grande no recarguen el catálogo entero.

**Lo que no se toca:** `reglas`, `fuente`, `aviso` y el comportamiento de `solo-conteo` cuando Blobs
no responde. Esos tres campos van siempre, con filtro o sin él. El comentario de cabecera del
archivo explica por qué la resta de inventario vive en el servidor: eso sigue igual, solo se filtra
la salida. **Y no se quita ningún campo de las piezas** —ver 2d: quitar `foto` sale más caro—.

#### Pruebas antes de desplegar (`pruebas/` ya tiene el patrón)

1. Sin parámetros → respuesta idéntica a producción (comparar contra
   `curl https://zephoracharms.com/.netlify/functions/disponibilidad`).
2. `?grupo=&ids=` → **idéntica al caso 1**. Es el contrato del requisito 2.
3. `?grupo=Marvel` → 16 piezas, todas con `grupo: "Marvel"`, con `reglas`/`fuente`/`aviso`.
4. `?grupo=Simbolos` (sin tilde) → **39 piezas**, igual que `?grupo=Símbolos`. Es el requisito 1.
5. `?grupo=SIMBOLOS` → las mismas 39.
6. `?grupo=Letras` → 27. `?grupo=Brazaletes` → 22. (Los dos grupos derivados.)
7. `?ids=letra-m` → una pieza, `devueltas: 1`, `total: 166`.
8. `?ids=letra-m,noexiste` → una pieza, sin error.
9. `?grupo=NoExiste` → 200 con listas vacías y `devueltas: 0`, **no** un 404 ni un 500: el prompt
   tiene que poder decir «no encontré eso» sin que el bot vea un error.
10. Con Blobs caído (simulado) y filtro → `fuente: 'solo-conteo'`, sin campo `disponible`.
11. Toda pieza devuelta conserva su campo `foto`.

**Anotar el tamaño de la respuesta en cada caso.** Es el número que decide si esto sirvió. Hoy son
53,352 caracteres; la tabla de arriba dice qué se espera por grupo.

### 3.2 — El nodo de n8n (sesión de PROYECTOAUTOMA1)

**Va después de 3.1, nunca antes.** Al revés, la descripción promete un filtro que no existe.

El nodo `disponibilidad` (`n8n-nodes-base.httpRequestTool` v4.5, id
`a1c7b6ce-46fc-460f-a454-7cbba633ac55`) hoy es un GET pelado:

```json
{ "url": "https://zephoracharms.com/.netlify/functions/disponibilidad",
  "options": { "timeout": 10000 } }
```

**No tiene `toolDescription`.** El modelo sabe qué hace solo por el nombre del nodo y por lo que dice
el prompt. Así que el cambio no es «añadir un parámetro»: hay que **crear** la descripción con
`$fromAI`, igual que ya hace `armar_carrito`.

El riesgo real del proyecto está acá, no en la función: **si la descripción queda mal redactada, el
bot deja de encontrar piezas y se pierden ventas el mismo día.** La descripción tiene que decir
explícitamente que **sin parámetros devuelve todo y eso siempre es correcto**, para que el bot tenga
salida cuando no sepa qué filtrar. Esa frase es la válvula de seguridad contra el caso Luciérnaga.

Ya está redactada y esperando revisión en la sesión de PROYECTOAUTOMA1. No se aplicará hasta que la
función esté desplegada y probada contra producción.

Aquí mismo entra el 3% gratis: `optimizeResponse: true` + `fieldsToInclude: 'except'` +
`fields: 'piezas.material,brazaletes.material'`. `material` son dos constantes repetidas 166 veces
y la información está íntegra en `tipo` (charm → Plata Esterlina 925, brazalete → baño de plata).
**Pero esto toca una regla del prompt escrita tras un incidente real** —el bot afirmó que un
brazalete era 925—, así que va con una línea nueva en el prompt que haga explícito el mapeo, o no va.
Decisión del dueño, no automática.

### 3.3 — Volver a medir (sesión de PROYECTOAUTOMA1)

Mismo método, 15–20 ejecuciones nuevas, comparar contra la tabla de la sección 1. Sin esto no
sabemos si sirvió. Dos cosas que hay que vigilar en esa medición, además del costo:

- **cuántas veces el bot llama sin filtro.** Si es casi siempre, el ahorro no aparece y hay que
  ajustar la descripción, no la función.
- **cuántas veces un `?grupo=` devuelve `devueltas: 0`.** Cada uno de esos es un posible caso
  Luciérnaga: una pieza negada que sí existe. Debería ser cero.

### 3.4 — Adelgazar el prompt (trabajo aparte, pero es la palanca principal)

**31% frente al 19–23% del filtro, y es la única que ayuda al 47% de mensajes que nunca llaman a
ninguna herramienta.** La revisión 1 la dejaba fuera como «trabajo aparte y más delicado»; sigue
siendo delicada, pero no es secundaria.

El prompt son 40,230 caracteres ≈ 13,400 tokens que se reenvían en **cada** iteración. Buena parte
son tablas de referencia que el modelo necesita rara vez: los 8 kits con sus piezas, las novedades
de noviembre, la tabla de tallas de anillos en centímetros, los enlaces de colecciones. Eso cabe en
una herramienta nueva —`ficha(tema)`— que se consulte cuando haga falta.

Lo que **no** se toca: las reglas de «NUNCA hagas esto», el saludo literal, el camino de pedido ya
hecho, los medios de pago, el manejo de agotados. Cada una de esas secciones está escrita a raíz de
un error real del bot y quitarlas lo reabre.

Esto necesita su propio diseño y su propia medición. No va en este traspaso, pero debería ir en el
siguiente.

---

## 4. Cuánto baja

Costo por mensaje según el tamaño de lo que devuelve `disponibilidad` (modelo; ver salvedades):

| caso | tokens del catálogo | 2 llamadas | 3 | 5 |
|---|---|---|---|---|
| hoy (completo) | 26,204 | $0.134 | $0.227 | $0.416 |
| `grupo=Símbolos` (el peor) | 6,044 | $0.093 | $0.147 | $0.255 |
| `grupo=Letras` | 3,694 | $0.089 | $0.137 | $0.236 |
| `grupo=Marvel` | 2,447 | $0.086 | $0.132 | $0.226 |
| `ids` con 3 piezas | 638 | $0.083 | $0.125 | $0.211 |

Y las tres palancas juntas —filtro por grupo, `material` fuera, prompt a 5,000— **bajan 54%**.

---

## 5. Por qué importa más allá de Zephora

Con la media medida de **$0.135** por mensaje, una conversación de 8 mensajes cuesta **~$1.08**, así que
**$300.000 COP/mes (~$70 USD) cubre hoy ~65 conversaciones.** Con las tres palancas, **~141**. El rango
es amplio a propósito: depende de cuántas veces el bot necesite herramientas, que es lo que más
varía entre conversaciones.

Una tienda que vende de verdad hace más de 141 conversaciones al mes. Para el proyecto de agencia eso
significa dos cosas concretas:

1. El precio recurrente del Nivel 3 tiene que subir, o la oferta tiene que llevar escrito un tope de
   conversaciones al mes.
2. Saber construir un agente de WhatsApp a $0.05 por conversación en vez de $0.135 por **mensaje** es
   en sí mismo la ventaja competitiva. Nadie que venda bots a tiendas está midiendo esto, y la parte
   que no es obvia —que el piso por iteración domina y que quitar el campo más gordo sale más caro—
   solo se ve midiendo.

---

## 6. Lo que necesita el visto bueno del dueño

- Desplegar `disponibilidad.mjs` a producción (`zephoracharms.com`). El `CLAUDE.md` de `proyecto-1`
  lo pide explícitamente.
- Tocar el nodo `disponibilidad` del workflow activo. Es el paso con riesgo de perder ventas el
  mismo día si la descripción queda mal.
- Quitar `material` de la respuesta del nodo, porque toca una regla del prompt escrita tras un
  incidente real (3.2).

El 3.1 se puede escribir y probar entero **sin desplegar**. Lo que no se debe hacer sin aprobación
es publicar.

---

## 7. Reparto

| | quién | por qué |
|---|---|---|
| `disponibilidad.mjs` + pruebas (3.1) | sesión de Zephora | tiene el repo y el deploy de Netlify |
| `toolDescription` + `$fromAI` (3.2) | sesión de PROYECTOAUTOMA1 | tiene escritura en n8n por MCP |
| volver a medir y comparar (3.3) | sesión de PROYECTOAUTOMA1 | tiene la línea base y el método |
| adelgazar el prompt (3.4) | por decidir | trabajo aparte, siguiente tanda |
| aprobar el deploy y el cambio del nodo | el dueño | tienda en producción vendiendo |

Si la sesión de Zephora prefiere que el parche de `disponibilidad.mjs` se escriba desde la sesión de
PROYECTOAUTOMA1, se puede: `proyecto-1` está clonado en ese contenedor en
`/home/user/zephoracharmsmanagement-hue/proyecto-1` (HEAD `02f6e89`). Pero las pruebas y el deploy es
mejor que corran donde siempre.

---

## 8. Primera medición después de desplegar (19 nov, 15:59 UTC)

El filtro se desplegó (PR #53), el nodo se cambió y se publicó a las ~13:37 UTC. Primera muestra de
ejecuciones reales posteriores: **n = 4 mensajes**, contra los 15 de la línea base.

| | línea base (n=15) | con filtro (n=4) |
|---|---|---|
| USD por mensaje | $0.135 | **$0.214** |
| llamadas al modelo por mensaje | 1.93 | **3.25** |

**Sale un 59% más caro.** Las tres cosas que se vigilaban salieron así:

1. **El bot usa el filtro bien.** 5 de 6 llamadas llevaron `grupo` o `ids`, con la forma exacta que
   se pretendía: `{"grupo":"Símbolos"}`, `{"ids":"letra-m,letra-j"}`, `{"grupo":"Brazaletes"}`.
2. **Cero consultas con `devueltas: 0`.** No se negó ninguna pieza por error. La válvula de
   seguridad del `toolDescription` funciona.
3. El costo subió.

### La causa

En la ejecución 10879, **un solo mensaje** hizo tres llamadas a `disponibilidad`:

```
{"grupo": "Símbolos"}      → 39 piezas, 13,202 caracteres
{"ids": "letra-m,letra-j"} →  2 piezas,  1,039 caracteres
{"grupo": "Brazaletes"}    → 22 piezas,  8,527 caracteres
```

Antes habría hecho **una** llamada con todo el catálogo. Ahora hace varias pequeñas, y **cada
iteración extra cuesta el piso de ~22,000 tokens**. Se ahorran ~20,000 de catálogo y se gastan
~22,000 de piso: pérdida neta.

Es exactamente el mecanismo descrito en 2d —el piso domina— pero por una vía que no se previó: no
fue quitar un campo lo que añadió iteraciones, **fue el filtro mismo cambiando el comportamiento del
agente**, de una llamada gorda a varias finas.

### Las dos correcciones candidatas

1. **En el `toolDescription`** (barata): decirle que pida todo lo que necesite en **una sola
   llamada**, porque `grupo` e `ids` se suman.
2. **En la función** (otro PR): que `grupo` acepte varios grupos separados por coma. Hoy acepta uno
   solo, así que un mensaje que necesite Símbolos *y* Brazaletes **no tiene más remedio** que llamar
   dos veces. Sin esto, la corrección 1 no puede cumplirse siempre.

**Ninguna se ha aplicado.** n=4 contra n=15 es muestra insuficiente para decidir, y nada se está
rompiendo: las clientas reciben respuestas correctas y lo único que sube es el costo. Hay una
segunda medición programada para tener 10 o más mensajes antes de tocar nada.

### Lo que este episodio enseña, y vale para cualquier cliente

El costo de un agente no está donde se mira. Está en **cuántas veces vuelve el bucle**, no en lo que
pesa cada respuesta. Cualquier optimización que ahorre payload pero añada una vuelta sale cara, y
eso no se puede razonar desde fuera: solo se ve midiendo antes y después.

---

## 9. Segunda medición: no se pudo completar por falta de tráfico (19 nov, 21:35 UTC)

Se intentó tres veces (18:03, 18:32 y 21:35 UTC). **La muestra post-filtro sigue en n=4.** Desde
las 15:41:23 UTC —casi seis horas— el workflow no ha tenido una sola ejecución.

### Lo que sí se aprendió revisando el día completo

Barriendo todas las ejecuciones desde las 05:00 UTC (medianoche en Bogotá) aparecieron seis
ejecuciones post-filtro de más de 25 segundos que **no** estaban medidas. No son mensajes: las seis
duran **exactamente 30,0 segundos** y salen por `Ignorar mensaje viejo` sin llegar al modelo
(comprobado en la 10877: `runData` vacío, `lastNodeExecuted: "Ignorar mensaje viejo"`). Son
fragmentos de ráfaga: la clienta manda varios mensajes seguidos, el workflow espera 30 s y solo el
último pasa al agente. Costo cero.

**El filtro de «más de 25 segundos» no distingue un mensaje de un descarte.** El criterio bueno es
la duración: los mensajes reales van de 33 a 50 s; los descartes caen clavados en 30,0 s. La línea
base de la §1 ya lo había manejado bien (20 leídas, 15 al modelo, 5 descartes excluidos), así que
**los $0.135 no están contaminados** y la comparación con los $0.214 sigue siendo válida. Pero
cualquier medición futura tiene que excluir los 30,0 s explícitamente.

### Volumen real, que es el dato que importa

Mensajes que llegaron al modelo, por día de Bogotá:

| día | mensajes al modelo | cuándo |
|---|---|---|
| 17 nov | 9 | 08:10 y 14:33, y una ráfaga larga a las 20:22–20:34 |
| 18 nov | 5 | 13:22–14:38 |
| 19 nov | 9 | 07:06–07:11 (5, pre-filtro) y 10:15–10:41 (4, post-filtro) |

**Media: 7,7 mensajes al modelo por día**, siempre en una o dos ráfagas y nada el resto del día.
Eso no son 7,7 clientas: una ráfaga es una sola conversación mandando varios mensajes. Hablamos de
**dos a cuatro conversaciones diarias**.

A ese volumen el bot cuesta **$1,04 al día** con la línea base y **$1,65** con el filtro puesto, o
sea unos **$31 contra $49 al mes**. La regresión del filtro, si se confirma, vale unos **$18 al
mes**. Es plata real pero pequeña: la optimización del costo importa **para los clientes de la
agencia**, no para Zephora.

### Decisión que queda en manos del dueño

No se reprogramó una cuarta vez: a dos o cuatro conversaciones al día, llegar a n=10 post-filtro
puede tardar días, y esperar a ciegas no es medir. Las opciones:

1. **Dejarlo.** La causa ya está identificada por lectura directa (la 10879 hizo tres llamadas a
   `disponibilidad` en un mensaje) y las dos correcciones están diseñadas. Se aplican y se mide
   después, con el tráfico que vaya llegando.
2. **Seguir esperando** a juntar n=10 antes de tocar nada.
3. **Probar en un workflow duplicado** con mensajes sintéticos, que da muestra inmediata sin
   arriesgar el bot en producción.

Las dos correcciones siguen **sin aplicar** y siguen necesitando visto bueno:
(a) decirle al `toolDescription` que pida todo en una sola llamada, porque `grupo` e `ids` se suman;
(b) que la función acepte `grupo` con varios grupos separados por coma (otro PR en `proyecto-1`).
