# Auditoría de conversión — 20 tiendas colombianas con anuncios activos en Meta

Medido el **19 de noviembre de 2026**, navegando como un visitante en móvil
(Chrome en un Pixel 7, idioma es-CO, hora de Bogotá), sin caché, sin tocar nada
y sin enviar ningún formulario. Cada página se observó **30 segundos** para dar
tiempo a que los scripts de medición se carguen y disparen.

Cada fila de la tabla sale de `prospeccion/fichas/<dominio>.json`, que guarda la
evidencia en bruto: los eventos del pixel interceptados, los avisos que la
propia librería de Meta imprime en la consola, los errores de JavaScript, el
peso real en KB y la frase exacta que activó cada detección de reseñas, de
contraentrega y de cuotas.

**Regla de este informe: solo se afirma lo que se puede demostrar.** Donde no
llegamos, lo decimos en la ficha y en la última sección.

## Resumen de las 20

Tiempos = hasta que el navegador termina de leer el HTML (DOMContentLoaded).
Peso = KB realmente transferidos. «Anuncio» = antigüedad del anuncio activo más
antiguo y número de versiones de anuncio, según la biblioteca de Meta.

| Tienda | Plataforma | Pixel: eventos vistos | ¿Fiable? | Portada | Ficha producto | WhatsApp | Reseñas | Anuncio / versiones |
|---|---|---|---|---|---|---|---|---|
| `sacriusshop.store` | Shopify | script carga, **0 envíos** | sí | 1.8 s / 2.7 MB | 0.9 s / 1.3 MB | no | sí | 365 d / 90 |
| `shop-rebel.co` | WooCommerce | portada: PageView · ficha: ViewContent+PageView | sí | 5.9 s / 5.8 MB | 1.2 s / 6.0 MB | no | sí | 1163 d / 25 |
| `chicsmovile.com` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 1.8 s / 8.6 MB | 1.2 s / 3.8 MB | no | sí | 440 d / 41 |
| `tiendamultimarca.com.co` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 1.7 s / 2.2 MB | 0.9 s / 810 KB | no | sí | 872 d / 18 |
| `lotengotienda.com` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 1.6 s / 2.0 MB | 1.2 s / 3.0 MB | no | sí | 356 d / 41 |
| `tienda-del-valle.com` | — | **el dominio no carga** | no | — | — | — | — | 796 d / 18 |
| `blasus.co` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 1.2 s / 4.0 MB | 1.0 s / 1.2 MB | sí | no | 495 d / 27 |
| `savatienda.com` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 1.6 s / 2.5 MB | 0.9 s / 4.4 MB | no | sí | 393 d / 31 |
| `lummia.com.co` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 1.9 s / 3.0 MB | 2.0 s / 1.8 MB | sí | sí | 351 d / 27 |
| `fantasiasnewyork.com` | WordPress | portada: PageView | sí | 2.4 s / 1.6 MB | — | no | no | 201 d / 45 |
| `sowicolombia.myshopify.com` | Shopify | portada: PageView · ficha: PageView | sí | 1.3 s / 2.2 MB | 1.0 s / 397 KB | sí | sí | 285 d / 30 |
| `viveshop.website` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 1.6 s / 1.7 MB | 0.9 s / 20.9 MB | no | sí | 160 d / 49 |
| `pintatienda.com` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 2.1 s / 2.1 MB | 0.8 s / 1.3 MB | no | sí | 387 d / 20 |
| `c6ac4e.myshopify.com` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 1.4 s / 2.3 MB | 1.1 s / 454 KB | sí | sí | 562 d / 12 |
| `safeforyourdreamss.com` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 1.4 s / 3.6 MB | 0.8 s / 1.2 MB | sí | sí | 498 d / 13 |
| `bestcool.online` | Funnelish | **no hay tienda que medir** | — | error 404 | — | — | — | 207 d / 26 |
| `colchonesspring.com.co` | otra / a medida | **no hay tienda que medir** | — | error 502 | — | — | — | 463 d / 11 |
| `nesimu.com` | Shopify | portada: PageView · ficha: PageView | sí | 1.8 s / 1.9 MB | 0.8 s / 119 KB | no | no | 363 d / 14 |
| `muchi.funnelish.com` | Funnelish | **no hay tienda que medir** | — | error 404 | — | — | — | 707 d / 7 |
| `karamelovirtual.com` | Shopify | portada: PageView · ficha: PageView+ViewContent | sí | 2.5 s / 2.8 MB | 0.9 s / 251 KB | no | sí | 407 d / 12 |

**Lo que salta a la vista en conjunto:** 4 de las 20 no tienen tienda que medir
(un dominio que no existe, dos páginas «Parked Domain» de Funnelish y un
servidor que devuelve error). De las 16 restantes, 11 no tienen ningún enlace a
WhatsApp en la portada. Y 7 arrastran el mismo aviso de Meta sobre el formato
de la moneda que mandan al pixel.

## Hallazgos tienda por tienda

### `sacriusshop.store` — el mejor prospecto de la lista
Su pixel de Meta está instalado en la tienda, pero no está midiendo nada. El
propio código de Meta lo escribe en la consola del navegador de cada visitante:
«*2521053324921915 is unavailable on this website due to it's traffic permission
settings*». En 60 segundos de visita (portada y ficha de producto) **no salió ni
un solo envío** hacia Meta, y ni siquiera se llegó a crear la cookie que el pixel
usa para reconocer al visitante. Traducido: lleva un año con anuncios activos y
90 versiones de anuncio, y Meta no está recibiendo de su web ni una visita ni un
producto visto para optimizar. Además hay un segundo pixel duplicado
(763057085204764) que Meta también marca como repetido. La tienda en sí está
bien montada (176 reseñas con Judge.me, contraentrega anunciada), lo que hace
más caro el fallo: el tráfico llega y la medición se pierde. Tampoco hay ningún
enlace a WhatsApp en la portada.

### `shop-rebel.co` — peso y errores de JavaScript
Su portada móvil carga **81 imágenes y entre 5,8 y 8 MB** según la medición, y
tardó entre 5,9 y 11,6 segundos en tres visitas distintas: es, con diferencia, la
más lenta e inestable de las 20. La ficha de producto pesa otros **6 MB**. A eso
se suma un error de JavaScript que se repite cuatro veces en la portada y dos en
la ficha (`wp is not defined`). El pixel funciona correctamente (PageView y
ViewContent), así que aquí el ángulo es la velocidad, no la medición. No hay
WhatsApp en la portada.

### `chicsmovile.com` — la portada más pesada
**8,6 MB y 323 peticiones** para ver la portada en un celular: es la más pesada
de las 20. Son 48 imágenes cargadas de golpe. El pixel mide bien y la ficha
menciona contraentrega y tiene 30 reseñas, así que el problema es solo el peso.
No hay enlace a WhatsApp en la portada.

### `tiendamultimarca.com.co` — pixel duplicado
Meta avisa en la consola de que su pixel **2690299491132346 está duplicado**
(«*Duplicate Pixel ID*»): está inicializado dos veces en la misma página. En
nuestra visita no llegamos a ver envíos de más (contamos 3, los mismos que
tiendas equivalentes), así que lo honesto es decir lo que se ve: Meta marca la
instalación como duplicada y eso es un error de configuración que conviene
limpiar, no que sus cifras estén infladas. Los eventos en sí llegan bien
(PageView en la portada y ViewContent en la ficha). No hay WhatsApp en la portada, y la ficha de producto no menciona
contraentrega en ningún sitio, que en Colombia es el principal desbloqueador de
compra para quien no conoce la tienda.

### `lotengotienda.com` — tres notas distintas en la misma ficha
En la misma ficha de producto conviven tres valoraciones que no coinciden:
arriba del todo «**¡4.8 por más de 1500 clientes!**», más abajo «**4.9
Estrellas** – Compras Verificadas», y el bloque de reseñas de la propia tienda
muestra «**5.0**». También hay dos cifras de clientes distintas: 1500
y «más de 477 personas compraron». Un cliente que lea con atención ve que los
números están puestos a mano. Además, el botón principal de compra dice «Envio
Gratis + Paga **el** Recibir». El pixel mide correctamente. No hay WhatsApp en
la portada.

### `tienda-del-valle.com` — el dominio no existe
No es que la tienda vaya lenta: **el dominio no existe en el DNS**. Lo
comprobamos con un resolutor independiente y la respuesta es NXDOMAIN
autoritativa de los servidores de `.com`. Nadie que escriba o haga clic en ese
dominio llega a ninguna parte. Su anuncio activo más antiguo lleva 796 días.
Antes de hablar con ellos hay que averiguar a qué dirección llevan realmente sus
anuncios: si apuntan aquí, están pagando por clics que no llegan a ninguna web.

### `blasus.co` — ficha sin reseñas y moneda mal formada
En su ficha de producto **no encontramos ni una sola reseña**: ni un contador, ni
una nota, ni un widget. Es una de las dos tiendas vivas con ficha de
producto y sin ninguna prueba social (la otra es nesimu.com). Aparte, Meta avisa en la consola de que el valor de
moneda que les envía el pixel va con un formato inválido («*Invalid parameter
format for currency*»), lo que impide optimizar por valor de compra. Tienen
WhatsApp, pero el enlace va sin mensaje escrito: el cliente abre el chat en
blanco y muchos no escriben. La portada son 4 MB y 338 peticiones.

### `savatienda.com` — la ficha pesa más que la portada
Su ficha de producto carga **4,4 MB y 41 imágenes**, casi el doble que su propia
portada: justo la página donde se decide la compra es la más lenta de cargar. En
la portada se repiten seis errores de JavaScript del mismo tipo. El pixel mide
bien y tienen 71 reseñas. No hay WhatsApp en la portada.

### `lummia.com.co` — bien montada, dos detalles finos
Esta es de las mejores de la lista: pixel midiendo PageView y ViewContent, 969
reseñas con Yotpo, contraentrega, pago en 6 cuotas y WhatsApp con mensaje ya
escrito. Lo que sí tiene arreglo: la portada hace **521 peticiones y carga 107
imágenes**, y la ficha de producto llega a **213 imágenes**, lo que explica que
sea la ficha más lenta de todas las que miden bien (2,0 s). Y Meta avisa del
mismo formato inválido de moneda. Como prospecto para este ángulo es flojo: hay
poco roto que enseñar.

### `fantasiasnewyork.com` — no se puede ver ni un producto sin registrarse
Recorrimos la portada y el catálogo y **no hay ninguna ficha de producto que se
pueda abrir**: las páginas de categoría muestran precios y, encima, un formulario
que pide iniciar sesión o registrarse con la cédula. El tráfico que llega de sus
45 versiones de anuncio se encuentra un muro de registro antes de poder ver qué
se vende. El pixel dispara PageView en la portada, pero como no hay ficha de
producto, Meta nunca recibe un ViewContent: no puede aprender qué productos
interesan ni armar públicos de remarketing por producto. Tampoco hay WhatsApp.

### `sowicolombia.myshopify.com` — la ficha no avisa a Meta de qué producto vieron
Dos cosas. Primera: su tienda está en la dirección por defecto de Shopify
(`sowicolombia.myshopify.com`), no en un dominio propio; el cliente que llega del
anuncio ve una URL que no es una marca. Segunda, y más cara: en la ficha de
producto solo se dispara **PageView, nunca ViewContent**. Meta sabe que alguien
pasó por una página, pero no que miró un producto, así que no puede optimizar
hacia quien de verdad está comprando. Sí tienen WhatsApp con mensaje escrito y 6
reseñas.

### `viveshop.website` — 21 MB en una sola ficha de producto
Su ficha de producto pesa **20,9 MB**, once veces más que la media de las demás
fichas de esta lista (1,9 MB). La causa es concreta: **dos imágenes animadas de 14,5 MB y
5,4 MB**, que son videos convertidos a WebP (los archivos se llaman literalmente
`ezgif.com-video-to-webp-converter`). En un celular con datos móviles eso es casi
el cupo de un día para ver un producto. Son 49 versiones de anuncio llevando
gente a esa página. El resto está correcto: el pixel mide PageView y ViewContent
y hay 9 reseñas. No hay WhatsApp en la portada.

### `pintatienda.com` — la tienda se llama «My Store»
El título de su web es «**Pinta Tienda – My Store**»: «My Store» es el nombre que
Shopify pone por defecto y que nadie cambió. Eso es lo que se lee en la pestaña
del navegador, en los resultados de Google y al compartir el enlace. Además hay
cuatro errores de JavaScript entre portada y ficha (`$ is not defined` y
`SearchForm is not defined`), lo que apunta a que el buscador de la tienda no
está funcionando. Y Meta avisa del formato inválido de moneda en el pixel. Lo
demás va bien: 35 reseñas con Judge.me y pago al recibir.

### `c6ac4e.myshopify.com` — tres pixeles a la vez y una dirección ilegible
La tienda vive en `c6ac4e.myshopify.com`: una dirección que nadie puede recordar
ni teclear, y que no transmite ninguna marca al cliente que llega del anuncio.
Por dentro hay **tres pixeles de Meta distintos** (1844503356033314,
276933702066332 y 872419677609914) y contamos **9 envíos a Meta en una sola
visita** de dos páginas: eso son eventos duplicados, que inflan las cifras y
confunden la optimización. Meta también avisa del formato inválido de moneda.
Nota aparte: es la misma marca que `sowicolombia.myshopify.com` (ambas se llaman
SOWI y comparten el mismo número de WhatsApp), así que son dos tiendas paralelas
compitiendo entre sí.

### `safeforyourdreamss.com` — su botón de WhatsApp no abre su WhatsApp
Su enlace de WhatsApp apunta a `phone=3150690629`, **sin el indicativo 57**.
Lo abrimos: WhatsApp responde «Chatea en WhatsApp con el 3150690629», un número
suelto, sin reconocer la cuenta. Con el 57 delante sí aparece «**Safe for your
dreams**». Es decir, quien pulsa el botón de WhatsApp en su web no llega a su
chat. Están las dos capturas en `prospeccion/capturas/` para enseñarlo. Aparte,
la portada carga 60 imágenes y 3,6 MB, y Meta avisa del formato inválido de
moneda en el pixel. El pixel sí mide PageView y ViewContent, y la ficha muestra
4.9/5 y contraentrega.

### `bestcool.online` — no hay tienda
El dominio a secas (`bestcool.online`) no tiene dirección IP y no carga. Con
`www` delante sí responde, pero lo que sirve es la página «**Parked Domain – This
page is not available**» de Funnelish, con error 404: el embudo no está conectado.
Hay 26 versiones de anuncio activas y un anuncio de hace 207 días. Antes de
contactar hay que confirmar a qué URL llevan sus anuncios; si llevan aquí, están
pagando por tráfico que aterriza en una página de error.

### `colchonesspring.com.co` — el servidor responde con error
En todos nuestros intentos del 19 de noviembre, su web **no llegó a cargar**: el
servidor devolvió un error 502 con una página vacía (0 KB, ni una imagen), y con
otra herramienta la conexión se cortó directamente. No podemos afirmar que esté
caída para todo el mundo ni que lleve así mucho tiempo —puede ser de ese momento
o afectar solo a ciertas redes—, pero sí que desde fuera, ese día, su tienda no
abría. Es lo primero que habría que volver a comprobar antes de grabar nada.

### `nesimu.com` — la portada no enseña ni un producto
Su portada no muestra **ningún producto y ningún precio**: una foto de archivo, una
«tabla comparativa» genérica de garantía/calidad/precios y una cinta que repite
«ENVÍO GRATIS PAGA EN CASA». Tampoco hay un solo enlace a una ficha de producto
en toda la página; tuvimos que buscar el catálogo por otra vía para encontrar
uno. Segundo problema, en la ficha de producto solo se dispara **PageView, nunca
ViewContent**, así que Meta no sabe qué productos se están mirando. Y esa ficha
tiene 3 imágenes, pesa 119 KB y no tiene ninguna reseña. No hay WhatsApp.

### `muchi.funnelish.com` — no hay tienda
Igual que bestcool: el dominio sirve la página «**Parked Domain – This page is
not available**» de Funnelish con error 404. El embudo no existe o está
desconectado, y su anuncio activo más antiguo lleva 707 días. No es prospecto
para este ángulo hasta saber a dónde llevan realmente sus anuncios.

### `karamelovirtual.com` — un pixel con el identificador mal puesto
Meta avisa de dos cosas en la consola de su tienda. La primera es seria:
«**Invalid PixelID: a non-numeric string**», es decir, en algún punto de su web
hay un pixel configurado con un identificador que no es un número, así que ese
pixel no puede medir nada. La segunda es el formato inválido de la moneda, que
impide optimizar por valor de compra. El pixel principal (1948841855455369) sí
funciona y dispara PageView y ViewContent. La ficha está bien resuelta (reseñas
con Yotpo, pago a cuotas con Addi) y pesa poco. No hay WhatsApp en la portada.

## Prospectos flojos para este ángulo

Hay que decirlo porque ahorra trabajo: **`lummia.com.co`** tiene la tienda bien
montada y solo le encontramos exceso de imágenes y el aviso de moneda; con
**`chicsmovile.com`** pasa parecido, el único hallazgo fuerte es el peso de la
portada. Y en las cuatro sin tienda (`tienda-del-valle.com`, `bestcool.online`,
`colchonesspring.com.co`, `muchi.funnelish.com`) el hallazgo es enorme pero no se
puede vender una mejora de conversión: primero hay que confirmar a qué URL van
sus anuncios, porque puede que su negocio viva en otra dirección distinta a la
que nos pasaron.

## Las capturas

En `prospeccion/capturas/`, todas en móvil y a doble densidad, listas para el
video. Son la primera pantalla que ve el visitante, que es justo la que decide.

- 15 tiendas tienen el par completo: `<dominio>-portada.png` y `<dominio>-producto.png`.
- 4 tienen portada y, en lugar de ficha de producto, `<dominio>-sin-ficha-de-producto.png`,
  que enseña lo que había en su lugar (la página «Parked Domain» de Funnelish en
  `bestcool.online` y `muchi.funnelish.com`, el error del servidor en
  `colchonesspring.com.co`, el catálogo con muro de registro en
  `fantasiasnewyork.com`). No se guardó ninguna captura llamada «-producto» de
  una página que no es una ficha de producto.
- `tienda-del-valle.com` no tiene ninguna captura: el dominio no existe, no hay
  nada que fotografiar.
- Aparte, dos capturas de la prueba del enlace de WhatsApp de
  `safeforyourdreamss.com`: `-whatsapp-enlace-de-su-web.png` (el enlace tal como
  está en su web, que no reconoce la cuenta) y `-whatsapp-con-indicativo-57.png`
  (el mismo número con el 57, que sí abre «Safe for your dreams»).

## Qué NO pudimos comprobar

Esta sección existe porque las fichas alimentan un video que se manda a un
desconocido. Todo lo de arriba se puede demostrar; todo lo de aquí abajo, no.

**1. No sabemos a qué URL llevan sus anuncios.** Medimos el dominio. Si un
anuncio apunta a una landing distinta, a `www` o a un enlace con parámetros, lo
que vería quien hace clic puede no ser lo que medimos. Es la limitación más
importante en las tiendas cuyo dominio no responde: sabemos que el dominio no
carga, no que su anuncio esté roto.

**2. Los segundos no son "lo que tarda su tienda" para un cliente colombiano.**
Medimos desde un servidor en la nube con red de centro de datos y sin caché:
mucho mejor que un móvil con datos móviles en Colombia. El número que damos es
el tiempo hasta que el navegador termina de leer el HTML (DOMContentLoaded), no
hasta que la página se ve completa. Como referencia honesta: son el **mejor caso
posible**. En un celular con 4G real, estos tiempos se multiplican. Los KB sí
son el peso real que paga el visitante en datos.

**3. El peso se midió una sola vez por página.** Una portada con carrusel o
imágenes aleatorias puede pesar distinto en otra visita.

**4. No comprobamos el embudo de compra.** No añadimos nada al carrito ni
enviamos ningún formulario, a propósito: no se toca la tienda de un tercero. Por
eso no podemos decir nada de si `AddToCart`, `InitiateCheckout` o `Purchase`
funcionan. Cuando decimos "no dispara X" nos referimos **solo** a la portada y a
una ficha de producto, visitadas sin interactuar, durante 30 segundos cada una.

**5. "No se detectó ningún evento de pixel en el navegador" no es "no tiene
pixel".** Una tienda puede medir por la API de Conversiones (servidor), que es
legítima y no se ve desde el navegador. En las fichas distinguimos: el pixel
carga y envía / el pixel carga y no envía / no hay rastro de pixel.

**6. No vimos su Administrador de Eventos.** No sabemos si los eventos que sí
envían llegan con calidad suficiente (parámetros, deduplicación, emparejamiento
avanzado), ni cuántos eventos pierden. Solo vemos lo que sale del navegador.

**7. Las reseñas y los métodos de pago se detectan por texto y por widget.**
Decimos "tiene reseñas" cuando hay un recuento, una nota sobre 5 o un widget
conocido, y guardamos en la ficha la frase exacta que lo activó. Aun así, un
texto puede estar en una plantilla sin reseñas reales detrás. Lo mismo con
contraentrega y cuotas: detectamos que lo **mencionan**, no que funcione.

**8. Una sola ficha de producto por tienda.** La elegimos automáticamente (la
primera enlazada, o la primera del catálogo). Otra ficha de la misma tienda
puede estar mejor o peor.

**9. Medimos un día concreto.** Todo lo de arriba es del 2026-11-19. Un 502, una
caída o un pixel mal configurado pueden ser de ese momento. Antes de grabar el
video conviene volver a cargar la tienda: si algo cambió, el hallazgo se cae.

**10. Los datos de la biblioteca de anuncios son antigüedad del anuncio activo
más antiguo y número de versiones, no gasto ni campaña continua.** Dicen que
siguen invirtiendo, no cuánto ni desde cuándo sin parar.
