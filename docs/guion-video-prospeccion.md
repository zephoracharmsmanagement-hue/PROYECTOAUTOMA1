# El video de 90 segundos · marco, criterio y guiones

**Para:** grabar hoy. Esto no es teoría; es lo que se lee en voz alta y lo que se ve en pantalla.
**Fecha:** 19 nov 2026 · **revisión 2**, con las fichas definitivas

> **Revisión 2.** La primera versión se escribió con una medición preliminar que tenía **dos errores
> graves**, los dos cazados por la auditoría definitiva:
>
> 1. **Los «6,7 segundos» no existían.** Ese número incluía los 6 segundos de espera que el script
>    añadía a propósito. El tiempo real lo reporta el navegador: **ninguna ficha de producto de las
>    veinte pasa de 2,2 s.** El tramo del cronómetro, que era el centro del guión, **se elimina**.
> 2. **Once tiendas parecían no tener pixel y sí lo tienen.** Shopify manda el evento por POST, no
>    en la URL. Mirando solo la URL salían limpias.
>
> Si grabas con la versión 1, dices a un desconocido un número cuatro veces más alto que el real y
> acusas a once tiendas de algo falso. Las fichas están en `prospeccion/fichas/` y el informe en
> `prospeccion/RESUMEN.md`.

El video se le manda en frío al dueño de una tienda que lleva meses pagándole a Meta. Se graba la
pantalla navegando **su** tienda desde un celular, encima va tu voz, y se monta en 9:16.

---

## 0. La regla que ordena todo lo demás

**Solo se afirma lo que la ficha demuestra.**

No es escrúpulo: es lo que hace que el video funcione. Quien recibe esto ha visto cien mensajes de
agencias que dicen «estás perdiendo ventas». Lo que no ha visto nunca es a alguien que le diga un
número exacto de su propia tienda. **La precisión es el argumento.** En el momento en que metes una
cifra inventada para que suene más fuerte, te conviertes en los otros cien.

Tres cosas que el informe marca como **no afirmables** y que por tanto no entran a ningún video:

- **Los tiempos de carga.** Son una sola medición desde un centro de datos, sin simular 4G ni
  celular de gama baja. Al repetirlos, shop-rebel osciló entre 0,6 s y 21,9 s. Sirven para comparar
  tiendas entre sí, **no para decirle a nadie cuánto espera su cliente**.
- **«No tiene pixel».** Puede estar midiendo con la API de Conversiones, que es server-side y no se
  ve desde el navegador. Lo afirmable es *«tu pixel de navegador arranca y no envía nada»*.
- **«Tus anuncios llevan a una página rota».** No miramos ni una URL de destino. Para las tiendas
  con dominio caído o parqueado, **hay que abrir el anuncio antes de decir nada**.

---

## 0 bis. El español tiene que ser colombiano

Se tutea, **nunca se vosea**. Nada de «querés», «podés», «tenés», «respondés», «vos», «mirá»,
«dale», «che». Se dice **quieres, puedes, tienes, respondes, tú, mira, listo**.

No es un detalle de estilo: el video entero se sostiene en que tú, en persona, entraste a su tienda.
Un «si querés» en el segundo 80 lo delata como extranjero o como plantilla, y ahí se cae todo lo que
construiste. El prompt del bot de Zephora tiene esta misma regla escrita a raíz de errores reales.

Tampoco uses tratamientos que quitan seriedad: nada de «parce», «mijo», «hágale», «sumercé».
Cercano no es confianzudo: le estás hablando a alguien que maneja un negocio.

---

## 1. Los 90 segundos, tramo por tramo

| tramo | tiempo | qué se oye | qué se ve |
|---|---|---|---|
| **Gancho** | 0–8 s | Nombras su tienda y dices cuántas cosas encontraste | Su portada, en celular, ya cargada |
| **Hallazgo 1** | 8–32 s | El más visual. Lo narras mientras se ve | La demostración en vivo |
| **Hallazgo 2** | 32–58 s | El que más cuesta en plata | La prueba que tengas |
| **Hallazgo 3** | 58–70 s | Solo si es sólido. Si no, se salta | Lo que corresponda |
| **Qué significa** | 70–80 s | Lo traduces a su negocio, sin vender todavía | Su tienda otra vez, quieta |
| **Cierre** | 80–90 s | La llamada a la acción | Tu cara o una tarjeta simple |

### Por qué no cierra el video en los primeros 5 segundos

Es el único problema que importa. Todo lo demás da igual si cierra.

**Lo que lo mata:** «Hola, mi nombre es Martín y represento a una agencia…». Eso es un anuncio, y lo
cierra antes de la coma.

**Lo que lo salva:** que en el segundo 1 vea **su propia tienda** en la pantalla y oiga **el nombre
de su tienda**. Eso dispara un «¿y este tipo cómo entró a mi tienda?» que compra los siguientes
veinte segundos. Nadie manda mil videos con la tienda de cada uno grabada.

**La fórmula del gancho**, en una frase y sin presentarte:

> «Entré a [NOMBRE] desde el celular, como entra tu cliente cuando toca tu anuncio, y encontré
> [N] cosas que te están costando plata. Te las muestro en noventa segundos.»

Te presentas en el **cierre**, no al principio.

### Las dos anclas visuales que reemplazan al cronómetro

La versión 1 se apoyaba en grabar la espera real de carga. **Eso se acabó**: las fichas cargan por
debajo de 2,2 s y los tiempos no son dato de campo. Las dos anclas que sí funcionan:

**El botón que no está.** Recorres su portada de arriba abajo, despacio, buscando el botón verde de
WhatsApp. No aparece. Se demuestra solo, no hace falta ningún número, y **lo tienen 12 de las 16
tiendas auditables**. Es el hallazgo más repetido del lote y justo lo que vendes.

**El archivo que se señala.** Para el peso no narres megas en abstracto: **enséñale la cosa
concreta**. «Estos tres GIFs pesan quince megas» mientras se ven los tres GIFs moviéndose es
infinitamente más fuerte que «tu página pesa 16,7 MB». El número acompaña a la imagen, no al revés.

---

## 2. Cómo elegir qué hallazgo va al video

Puntúa de 0 a 2 en tres cosas:

1. **¿Se demuestra en pantalla sin explicar?** — Pesa más que las otras dos.
2. **¿Le duele en plata de forma evidente?**
3. **¿Lo arreglamos rápido?** — Esto **no decide qué muestras**, decide qué ofreces al final.

| hallazgo | se ve | duele | lo arreglamos | cómo se demuestra |
|---|---|---|---|---|
| Sin botón de WhatsApp | **2** | 2 | 2 | Lo buscas en pantalla y no está. Imbatible. |
| Un archivo enorme señalable | **2** | 2 | 2 | Se ve el GIF y se dice su peso |
| Reseñas pagadas que no se ven | **2** | 2 | 2 | La app instalada y la ficha vacía |
| Pixel que no dispara nada | 0 | **2** | 2 | No se ve. Se prueba diciendo su ID |
| Pixel sin `ViewContent` | 0 | **2** | 2 | Igual: se prueba con el ID |
| Pixel que cuenta doble | 0 | **2** | 2 | Igual |
| Sin reseñas en la ficha | 2 | 1 | 1 | Bajas por la ficha y no hay nada |
| No se ve contraentrega | 2 | **2** | 1 | Se ve en la ficha. Ojo con la redacción |
| Dominio `.myshopify.com` | **2** | 1 | 2 | Se señala la barra de direcciones |
| ~~Ficha lenta~~ | — | — | — | **Retirado**: no es dato de campo |

### Las tres reglas de selección

**Primero el más visual, al final el más caro.** El visual te gana la atención; el caro te crea la
urgencia. Empezar por el pixel es empezar explicando, y ahí lo pierdes.

**Como máximo UNO que haya que explicar.** Si dos de tres necesitan narración, el video deja de ser
una demostración y se vuelve una clase. Nadie se queda a una clase de un desconocido.

**Dos hallazgos buenos valen más que tres apurados.**

### El caso del pixel, que es el más valioso y el más difícil

Es el hallazgo que más plata mueve y **no se ve en pantalla**. Mostrar el panel de red del navegador
es incomprensible para un dueño de tienda.

La solución no es mostrarlo: es **decir su número de pixel**. «Tu pixel, el que termina en 0235».
Eso prueba que entraste de verdad y que miraste, sin enseñar nada técnico. **El ID es el recibo.**
Nadie que mande videos en masa sabe el pixel de nadie. Di los últimos cuatro dígitos, no los
dieciséis.

**Y di siempre «tu pixel de navegador»**, nunca «tu pixel». La diferencia no es cosmética: si miden
con la API de Conversiones, «no tienes pixel» es falso y te lo pueden refutar en una frase.

---

## 3. Los cinco primeros, en orden

Ordenados por fuerza del hallazgo, no por tamaño del anunciante.

| # | tienda | el hallazgo que vende | señal de gasto |
|---|---|---|---|
| 1 | **tiendamultimarca.com.co** | 3 GIFs de Giphy: 7,3 + 5,8 + 2,0 MB en una ficha de 16,7 MB | 872 d · 18 v |
| 2 | **sowicolombia.myshopify.com** | un solo GIF de 11,4 MB; y el pixel nunca manda `ViewContent` | 285 d · 30 v |
| 3 | **sacriusshop.store** | dos pixeles arrancados, cero eventos — ni `PageView` | 365 d · **90 v** |
| 4 | **karamelovirtual.com** | paga Yotpo **y** Okendo y no muestra ni una reseña | 407 d · 12 v |
| 5 | **c6ac4e.myshopify.com** | un pixel cuenta `ViewContent` dos veces: campañas infladas | 562 d · 12 v |

**Por qué estos cinco:** cada uno tiene un hallazgo que se señala en pantalla o se prueba con un ID,
que cuesta plata de forma evidente, y que ustedes arreglan. Los tres primeros además tienen un
archivo o un número tan desproporcionado que el dueño no puede no reaccionar.

**Los que dejo fuera y por qué:** `lummia.com.co` y `safeforyourdreamss.com` están bien montadas —el
informe lo dice: «aquí hay poco que vender»—; las cuatro con ⚠️ (`tienda-del-valle.com`,
`bestcool.online`, `muchi.funnelish.com`, `colchonesspring.com.co`) **no se auditaron** y necesitan
que mires su anuncio antes de nada; el resto son buenos segundos (shop-rebel, viveshop, chicsmovile,
pintatienda, savatienda) pero su hallazgo es «pesas mucho», que es el mismo de los tres primeros y
con menos fuerza.

---

## 4. Los cinco guiones

Léelos tuteando, con calma. Donde dice `[CORTE]` cambia lo que se ve.

---

### Guion 1 · tiendamultimarca.com.co

*Hallazgos: los tres GIFs (visual y caro), sin WhatsApp (visual), sin contraentrega (de refuerzo).*

> `[PANTALLA: portada de tiendamultimarca.com.co en celular, ya cargada]`
>
> Entré a Tienda Multimarca desde el celular, como entra tu cliente cuando toca tu anuncio, y
> encontré tres cosas. Noventa segundos.
>
> `[CORTE: la ficha de producto, bajando hasta donde están los GIFs. Que se vean moviéndose.]`
>
> Mira estas tres animaciones. Pesan **siete megas, seis megas y dos megas**. Quince megas que tu
> cliente se descarga con sus datos para ver esto, antes de poder decidir si compra.
>
> La página entera pesa dieciséis megas y medio. Quince son estas tres.
>
> `[CORTE: te quedas quieto sobre los GIFs un segundo]`
>
> No hay que quitarlas. Comprimidas pesan una fracción y se ven igual. Es de las cosas más baratas
> de arreglar que vas a encontrar.
>
> `[CORTE: recorres la portada de arriba abajo, despacio, como buscando algo]`
>
> La segunda: no hay por dónde escribirte. Ni botón de WhatsApp, ni chat, nada. El que llega de un
> anuncio casi nunca compra de una — tiene una pregunta, y si no tiene a quién hacérsela, se va.
>
> `[CORTE: la ficha de producto, en la zona de precio y pago]`
>
> Y la tercera, más chica: en la ficha no dice en ninguna parte que se pueda pagar contra entrega.
> En Colombia eso es lo que desbloquea la primera compra de alguien que no te conoce.
>
> `[CORTE: tu cara o una tarjeta simple]`
>
> Soy Martín. Las tres se arreglan, y la de las animaciones es cosa de una tarde. Si quieres, te
> mando el detalle de lo que encontré, sin costo y sin compromiso. Me respondes a este mismo chat.

---

### Guion 2 · sowicolombia.myshopify.com

*Hallazgos: el GIF de 11,4 MB (visual y caro), el pixel sin `ViewContent` (caro), el dominio
(visual, de refuerzo).*

> `[PANTALLA: la ficha de producto de sowicolombia, en celular]`
>
> Entré a Sowi desde el celular y encontré tres cosas. Van en noventa segundos.
>
> `[CORTE: bajas hasta el GIF grande. Que se vea moviéndose.]`
>
> Esta sola animación pesa **once megas y medio**. Para que te hagas una idea: es seis veces más
> que todo el resto de la página junta. Un solo archivo.
>
> La ficha entera son dieciséis megas, y once son esto.
>
> `[CORTE: te quedas quieto]`
>
> Comprimido se ve igual y pesa una fracción. No hay que quitarlo.
>
> `[CORTE: la ficha, quieto]`
>
> La segunda no se ve, y es la que más caro te sale: tu pixel de navegador, el que termina en
> **cuatro siete siete nueve**, manda el aviso de que alguien entró, pero **nunca manda cuál
> producto miró ni cuánto vale**.
>
> Eso significa que Meta sabe que entró gente, pero no sabe qué les interesó. Y sin eso no te puede
> buscar compradores parecidos. Está adivinando con tu plata.
>
> `[CORTE: señalas la barra de direcciones]`
>
> Y la tercera, más chica: tu tienda sigue en la dirección que te da Shopify por defecto, punto
> myshopify punto com. El que viene de un anuncio lee esa dirección antes de ver tu producto.
>
> `[CORTE: tu cara o tarjeta]`
>
> Soy Martín. Las tres se arreglan, y las dos primeras en días. Si quieres, te mando el detalle sin
> costo y sin compromiso. Me respondes por aquí.

---

### Guion 3 · sacriusshop.store

*Hallazgos: el pixel que no dispara (caro) y sin WhatsApp (visual). **Dos, no tres.***

> `[PANTALLA: portada de sacriusshop.store en celular]`
>
> Entré a Sacrius desde el celular y encontré dos cosas. Van en un minuto.
>
> `[CORTE: recorres la portada de arriba abajo, despacio, buscando el botón verde. Que se vea que
> lo buscas.]`
>
> La primera: no hay por dónde escribirte. Ni botón de WhatsApp, ni chat, nada.
>
> El que llega de un anuncio casi nunca compra de una. Tiene una pregunta: la talla, el envío, si
> es original. Si no tiene a quién preguntarle, se va. Y no vuelve.
>
> `[CORTE: te quedas quieto en la ficha de producto]`
>
> La segunda no se ve, y es la cara. Tienes **dos pixeles de Meta instalados** —uno termina en **uno nueve uno
> cinco** y el otro en **cero siete seis cuatro**— y los dos arrancan bien.
>
> Pero en las dos páginas que miré, esperando seis segundos en cada una, **ninguno de los dos mandó
> un solo aviso a Meta**. Ni siquiera el básico, el de «entró alguien».
>
> Miré otras quince tiendas el mismo día. En las quince ese aviso aparece. En la tuya no.
>
> `[CORTE: quieto]`
>
> Si tus campañas se están optimizando con lo que ve el navegador, están trabajando a ciegas. Puede
> que estés midiendo por el lado del servidor, que no se ve desde fuera — pero si no, vale la pena
> que lo revises hoy.
>
> `[CORTE: tu cara o tarjeta]`
>
> Soy Martín. Las dos se arreglan rápido. Te mando el detalle completo sin costo si te sirve — me
> respondes por aquí.

---

### Guion 4 · karamelovirtual.com

*Hallazgos: las dos apps de reseñas invisibles (visual y caro), sin contraentrega, sin WhatsApp.*

> `[PANTALLA: la ficha de producto de karamelovirtual.com, en celular]`
>
> Entré a Karamelo desde el celular y encontré algo que me pareció raro. Te lo muestro.
>
> `[CORTE: bajas por la ficha de producto entera, hasta el final, despacio]`
>
> Esta es tu ficha de producto, de arriba abajo. **Ni una sola reseña.**
>
> `[CORTE: te quedas quieto al final de la ficha]`
>
> Y lo raro es esto: tienes **dos aplicaciones de reseñas instaladas** y pagando. Yotpo y Okendo,
> las dos a la vez. Están ahí, cargando en tu tienda, y no se ve ni una.
>
> O no hay reseñas publicadas, o el widget no está en la plantilla, o tarda tanto en cargar que no
> alcanza a verse. Sea cual sea, **ya pagaste por la herramienta** y el que llega de tu anuncio no
> ve ni una. Es de las cosas más rentables de arreglar que existen, porque la
> inversión ya la hiciste.
>
> `[CORTE: la zona de precio y pago de la ficha]`
>
> La segunda: dice que se puede pagar a cuotas con Addi y con Sistecrédito, pero **no dice en
> ninguna parte que se pueda pagar contra entrega**. En Colombia eso es lo que desbloquea la primera
> compra de alguien que no te conoce.
>
> `[CORTE: recorres la portada buscando el botón verde]`
>
> Y la tercera: tampoco hay por dónde escribirte. Ni WhatsApp, ni chat.
>
> `[CORTE: tu cara o tarjeta]`
>
> Soy Martín. Lo de las reseñas se arregla en un rato y ya lo estás pagando. Si quieres te mando el
> detalle, sin costo y sin compromiso. Me respondes por aquí.

---

### Guion 5 · c6ac4e.myshopify.com

*Hallazgos: el pixel que cuenta doble (caro), el peso de la ficha, el dominio (visual).*

> `[PANTALLA: señalas la barra de direcciones, con c6ac4e.myshopify.com bien visible]`
>
> Entré a tu tienda desde el celular y lo primero que vi fue esto. `[señalas la barra]`
>
> Tu dirección es ce seis a ce cuatro e, punto myshopify punto com. Ni siquiera lleva el nombre de
> tu marca. Es lo primero que lee alguien que llega de tu anuncio y no te conoce.
>
> `[CORTE: te quedas quieto en la ficha de producto]`
>
> La segunda no se ve y es la importante. Tienes **tres pixeles de Meta** corriendo a la vez. Eso
> por sí solo no está mal.
>
> Lo que sí medí es esto: en **una sola visita** a esta ficha, el pixel que termina en **nueve nueve uno cuatro** mandó el aviso de «miró este producto» **dos veces**. Los otros dos lo mandaron una.
>
> Ese pixel está contando de más. Los números de tus campañas están inflados, y las decisiones que
> tomas mirándolos están basadas en datos que no son.
>
> `[CORTE: bajas por la ficha de producto]`
>
> Y la tercera: esta ficha pesa casi **catorce megas**. Eso se lo descarga tu cliente con sus datos
> antes de decidir.
>
> `[CORTE: tu cara o tarjeta]`
>
> Soy Martín. Lo del pixel doble se arregla en minutos, y mientras tanto estás midiendo mal. Si
> quieres te mando el detalle, sin costo y sin compromiso. Me respondes por aquí.

---

## 5. Qué NO decir

Estas frases suenan mejor y por eso son peligrosas.

| ❌ No digas | Por qué | ✅ Di |
|---|---|---|
| «Tu ficha tarda 7 segundos» | **Era un error de medición.** Ninguna pasa de 2,2 s | Nada sobre tiempos. No son dato de campo |
| «Tu tienda no tiene pixel» | Puede medir por la API de Conversiones, que no se ve | «Tu pixel de navegador arranca y no envía nada» |
| «Tus anuncios llevan a una página rota» | No miramos ni una URL de destino | Nada, hasta abrir el anuncio |
| «Estás perdiendo el 40% de tus ventas» | No lo mediste ni puedes medirlo desde afuera | «Esta animación pesa once megas» |
| «No ofreces pago contra entrega» | La ficha no lo **menciona ahí**. Puede estar en el checkout | «En la ficha no vi que ofrezcas contraentrega» |
| «Tu competencia ya tiene esto resuelto» | No sabes quién es ni qué tiene | Nada. Sobra. |
| «Tu tienda está muy mal hecha» | Es un insulto, no un hallazgo | «Encontré tres cosas concretas» |
| «Con esto vas a duplicar las ventas» | No lo sabes, y si no pasa quedas como mentiroso | «Esto se arregla en días» |
| «Nadie te compra así» | Lleva meses pagando anuncios: algo vende | «El que llega con una duda, se va» |
| «Tu tienda está caída» | De colchonesspring solo sabemos que **a nosotros** no nos respondió | Nada. Comprobar desde Colombia primero |

**La prueba del contraataque:** antes de decir una frase, pregúntate qué pasa si él responde «¿y tú
cómo sabes eso?». Si la respuesta es «lo medí, mira», va. Si es «bueno, es lo normal», no va.

---

## 6. El cierre y la llamada a la acción

El cierre es **lo más corto del video**. Diez segundos. Y pide **una sola cosa**.

**El detalle completo del diagnóstico, gratis.** No una llamada, no una reunión, no que te compre
nada. Pedir una reunión en frío tiene una barrera altísima; pedir «¿te mando lo que encontré?» casi
no tiene ninguna, y el que dice que sí ya entró en conversación.

Nada de «agenda aquí», nada de enlaces. Que responda donde ya está.

**Lo que NO va en el video:** los precios. El video vende la auditoría gratis; la auditoría vende el
paquete. Mezclar los dos pasos mata la respuesta.

**Un detalle que sube la respuesta:** manda el video **sin pedir nada en el primer mensaje**. Solo
el video y una línea: «Hice esto mirando tu tienda, por si te sirve». La pregunta va al final del
video, no en el mensaje.

---

## 7. Montaje

`herramientas/video_pauta.py` en bendito-hogar monta video con **subtítulos de una a tres palabras
sincronizados palabra por palabra con tu voz** (faster-whisper), y saca 9:16 y 4:5. Eso es lo que
más trabajo ahorra.

**Pero está hecha para anuncios de producto.** Tres cosas:

1. Su fórmula termina en **cierre con precio** y lleva una **banda fija abajo con el precio y «Envío
   gratis · Pagas al recibir»**. En un video de prospección esa banda no va: hay que pasarle `banda`
   y `cierre` vacíos o adaptados, o tocar el script.
2. Corre con rutas de **Windows** fijas —ffmpeg y las fuentes—, así que se ejecuta en tu máquina.
3. La voz va en `creativos/<producto>/voz/<id>.mp3`. Si existe, los tiempos salen de tu voz real;
   si no, los estima y saca un borrador para revisar el montaje.

**El audio** se normaliza a −14 LUFS con pico −1,5 dB. `video_pauta.py` ya lo hace al armar.

**Flujo para hoy:** grabas la pantalla de las cinco tiendas siguiendo cada guion → grabas las voces
→ montas → revisas el borrador → mandas.

---

## 8. Antes de mandar cada video, comprueba

- [ ] Cada número que dije está en `prospeccion/fichas/<dominio>.json`, tal cual.
- [ ] **No digo ningún tiempo de carga.** Ninguno es dato de campo.
- [ ] Donde hablo del pixel digo **«tu pixel de navegador»**, no «tu pixel».
- [ ] No afirmo nada sobre a dónde llevan sus anuncios.
- [ ] Dije el nombre de su tienda en los primeros 5 segundos.
- [ ] Se ve su tienda en pantalla desde el segundo 1.
- [ ] No me presento hasta el cierre.
- [ ] Pido una sola cosa, y es gratis.
- [ ] Ninguna frase de la tabla de «qué no decir».
- [ ] Dura 90 segundos o menos.
- [ ] Los subtítulos están sincronizados (reviso el borrador antes de mandar).
