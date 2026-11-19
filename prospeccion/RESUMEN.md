# Auditoría de conversión en móvil — 20 tiendas colombianas

Medido el **19 de noviembre de 2026**. Cada tienda se abrió en un **Pixel 7 emulado**, con idioma `es-CO` y hora de Bogotá, en una sesión limpia y sin caché. Se midió la **portada** y una **ficha de producto**, dejando **6 segundos** tras la carga para que corrieran los scripts y disparara el pixel. No se tocó ni se envió nada: no se añadió al carrito, no se rellenó ningún formulario. El único clic fue aceptar banners de cookies, y en estas 20 tiendas **no apareció ninguno**.

Los datos crudos están en `fichas/<dominio>.json` y las capturas en `capturas/`. El script es `auditoria.js`.

## Cómo leer estos números

- **Segundos** = `domContentLoadedEventEnd` que reporta el propio navegador. **No incluye** los 6 s de espera que añadimos a propósito. Esto importa: una medición anterior daba 6,7–6,9 s en varias fichas de producto, y eso era la espera de 6 s sumada al tiempo real. Ninguna ficha de producto de este lote pasa de 2,2 s.
- **KB** = bytes reales de red (comprimidos, con cabeceras), leídos del propio motor del navegador, en una sesión sin caché.
- **Pixel: eventos observados** = eventos que **de verdad salieron** hacia `facebook.com/tr`. Se leen tanto por URL como dentro del cuerpo de los POST, porque Shopify manda el evento por POST y mirando solo la URL once tiendas parecían no tener pixel cuando sí lo tienen.
- **Una advertencia que vale para todo el informe:** que no veamos un evento **no significa que la tienda no tenga pixel**. Puede estar usando la **API de Conversiones server-side**, que es legítima y no se ve desde el navegador. Por eso, donde no vimos nada, lo que decimos es *«no se detectó ningún evento de pixel en el navegador»*, y nunca *«no tiene pixel»*.
- Las ⚠️ marcan tiendas de las que **no obtuvimos una tienda que auditar** (dominio caído, parqueado o que no respondió). Sus filas describen la página que se sirvió, no un negocio funcionando.

## Tabla

| Tienda | Plataforma | Pixel: eventos observados | s (portada / producto) | KB (portada / producto) | WhatsApp | Reseñas |
|---|---|---|---|---|---|---|
| sacriusshop.store | Shopify | **sin evento detectado** (2 pixeles arrancados) | 1.45 / 0.50 | 2757 / 688 | **no** | sí |
| shop-rebel.co | WooCommerce | PageView/ViewContent · `803340261375111` | 7.61 / 1.22 | 9067 / 7095 | **no** | sí |
| chicsmovile.com | Shopify | PageView/ViewContent · `3210476655939535`+`866524520811638` | 1.94 / 1.02 | 8817 / 5775 | **no** | sí |
| tiendamultimarca.com.co | Shopify | PageView/ViewContent · `2690299491132346` | 1.73 / 0.73 | 2580 / **16673** | **no** | sí |
| lotengotienda.com | Shopify | PageView/ViewContent · `520188082914731` | 1.24 / 0.78 | 2441 / 2652 | **no** | sí |
| tienda-del-valle.com ⚠️ | — | no medido | — | — | — | — |
| blasus.co | Shopify | PageView/ViewContent · `1838033743070235`+`866524520811638` | 1.56 / 0.70 | 5572 / 3554 | sí | **no** |
| savatienda.com | Shopify | PageView/ViewContent · `466170178315761` | 1.70 / 0.83 | 2540 / 4945 | **no** | sí |
| lummia.com.co | Shopify | PageView/ViewContent · `180486080737869` | 2.37 / 1.39 | 5159 / 2069 | sí | sí |
| fantasiasnewyork.com ⚠️ | A medida (Nuxt/Vue) | PageView · `839855401097678` | 2.14 / — | 2744 / — | **no** | **no** |
| sowicolombia.myshopify.com | Shopify | **solo PageView** · `1444759909824779` | 1.38 / 0.77 | 2165 / **16224** | sí | sí |
| viveshop.website | Shopify | PageView/ViewContent · `791174826836498` | 1.21 / 0.81 | 1776 / 9049 | **no** | sí |
| pintatienda.com | Shopify | PageView/ViewContent · `1590014615088275` | 1.65 / 0.63 | 2211 / 6356 | **no** | sí |
| c6ac4e.myshopify.com | Shopify | PageView/ViewContent · 3 pixeles | 1.27 / 1.00 | 2374 / **13903** | sí | sí |
| safeforyourdreamss.com | Shopify | PageView/ViewContent · `1126724432600978` | 1.55 / 0.95 | 3660 / 730 | sí | sí |
| bestcool.online ⚠️ | Funnelish | no fiable (dominio parqueado) | — | — | — | — |
| colchonesspring.com.co ⚠️ | — | no fiable (no respondió) | — | — | — | — |
| nesimu.com | Shopify | **solo PageView** · `1148743066661797` | 1.88 / 0.42 | 1969 / 2398 | **no** | sí |
| muchi.funnelish.com ⚠️ | Funnelish | no fiable (dominio parqueado) | — | — | — | — |
| karamelovirtual.com | Shopify | PageView/ViewContent · `1948841855455369` | 2.15 / 0.71 | 3080 / 566 | **no** | **no** (Yotpo y Okendo instalados) |

---

## Hallazgos por tienda

### sacriusshop.store
Tu tienda carga el pixel de Meta y **arranca dos**: `2521053324921915` y `763057085204764`. Pero en las dos páginas que medimos, esperando seis segundos en cada una, **ninguno de los dos mandó un solo evento** — ni siquiera el `PageView` básico. En las otras quince tiendas que sí pudimos auditar, ese `PageView` aparece sin falta. Lo comprobamos dos veces y por separado, y no hubo ningún fallo de red hacia Meta que lo explicara. Si tus campañas optimizan con lo que ve el navegador, están trabajando a ciegas. Segundo: **no hay ningún enlace de WhatsApp** en la portada ni en la ficha de producto. Lo demás está bien: la ficha muestra 176 reseñas y anuncia el pago contra entrega.

### shop-rebel.co
La portada carga **81 imágenes y pesa 9 MB**, que es con diferencia la portada más pesada de las veinte. Pero el dato más llamativo es otro: al medirla seis veces el tiempo hasta que la página está lista saltó entre **0,6 s y 21,9 s**. Esa inestabilidad es en sí el problema — un comprador que llega del anuncio no sabe si le va a cargar en medio segundo o en veintidós. Segundo: **no hay WhatsApp** por ninguna parte. Tercero: la ficha de producto habla de cuotas con Sistecrédito y Addi, pero **no menciona el pago contra entrega**, que en Colombia es lo que desbloquea la primera compra de un desconocido.

### chicsmovile.com
La portada pesa **8,8 MB con 48 imágenes**. Es la segunda más pesada del lote y la primera pantalla que ve quien llega del anuncio. Segundo: **no encontramos ningún enlace de WhatsApp**, ni en la portada ni en la ficha, y eso con 41 versiones de anuncio activas: estás pagando por tráfico que, si no compra solo, no tiene por dónde preguntarte. El pixel está bien montado (dos pixeles que disparan `PageView` y `ViewContent`), la ficha muestra 30 reseñas y anuncia el pago contra entrega.

### tiendamultimarca.com.co
La ficha de producto que medimos pesa **16,7 MB**, y **15,8 MB de eso son imágenes**. Concretamente, **tres GIFs animados alojados en Giphy** que pesan **7,3 MB, 5,8 MB y 2,0 MB**. Son 15 MB que el comprador se descarga con sus datos móviles para ver tres animaciones. Comprimir eso es el cambio más barato y más grande que puedes hacer hoy. Segundo: **no hay WhatsApp**. Tercero: la ficha **no menciona el pago contra entrega** en ningún sitio.

### lotengotienda.com
La tienda está razonablemente sana: el pixel dispara `PageView` y `ViewContent`, y la ficha carga rápido (0,78 s). Dos cosas para mejorar: **no hay ningún enlace de WhatsApp**, y la ficha de producto **no menciona el pago contra entrega**, pese a que vendes un producto de decisión emocional a tráfico frío. La ficha además carga 45 imágenes, bastantes para un solo producto.

### tienda-del-valle.com ⚠️
**No pudimos auditarla: el dominio no existe en DNS.** La consulta al DNS público de Google devuelve `NXDOMAIN` tanto para `tienda-del-valle.com` como para `www.tienda-del-valle.com`, y la respuesta viene de los servidores de `.com`, es decir que el dominio no está delegado. Lo comprobamos por dos vías distintas y en el mismo momento un dominio de control respondió con normalidad, así que no es un problema de nuestra conexión. Si algún anuncio activo lleva a esa dirección, ese tráfico se pierde entero. **No comprobamos a qué URL apuntan los anuncios**, así que puede que lleven a otro dominio o a un perfil.

### blasus.co
La ficha de producto que medimos **no muestra ninguna reseña**: ni texto de valoraciones, ni estrellas, ni ningún widget de reseñas instalado. Es la objeción más común en compra fría y ahora mismo no la estás respondiendo. Segundo: tienes **dos números de WhatsApp distintos** conviviendo en el mismo sitio (`573052247820` y `573054121507`); conviene dejar uno solo, porque el que escribe al que nadie atiende se pierde. Tercero: la portada pesa **5,6 MB con 45 imágenes**. El pixel está bien: dos pixeles disparando `PageView` y `ViewContent`.

### savatienda.com
El pixel es de los mejor montados del lote: dispara `ViewContent` con los parámetros de contenido y de valor (`content_ids`, `value`), que es lo que necesita Meta para optimizar de verdad. El hallazgo principal es otro: **no hay ningún enlace de WhatsApp**. Segundo: la ficha de producto pesa **4,9 MB, de los que 4,4 MB son imágenes** repartidas en 41 archivos. La ficha muestra 71 reseñas y anuncia el pago al recibir, así que lo de fondo está bien.

### lummia.com.co
Es, con diferencia, la tienda mejor montada de las veinte: 969 reseñas visibles, pago contra entrega, cuotas con Addi, WhatsApp, y el pixel disparando `ViewContent`. El único hallazgo sólido es de eficiencia: la ficha de producto carga **213 imágenes y hace 406 peticiones**. Pesa poco (2 MB), así que las imágenes están bien comprimidas, pero son muchísimas idas y vueltas para una sola página. Si esperas crecer el tráfico pago, ahí hay margen. **Si busco algo que vender, aquí hay poco.**

### fantasiasnewyork.com ⚠️
No es WordPress ni Shopify: es una tienda **hecha a medida con Nuxt**. Dos cosas comprobadas. Primero: **las imágenes de la portada están enlazadas desde sitios ajenos** — un medio mexicano, un blog de Zaragoza, un bucket de terceros. Si cualquiera de esos sitios borra o mueve su imagen, tu portada se rompe, y además no controlas ni su peso ni su velocidad. Segundo: **no hay ningún enlace de WhatsApp** y en la portada no aparece ninguna reseña, con 45 versiones de anuncio activas. **No pudimos abrir una ficha de producto individual** (la tienda las pinta desde el navegador y nuestro recorrido no llegó), así que de la ficha de producto no afirmamos nada.

### sowicolombia.myshopify.com
Dos hallazgos fuertes. Primero: la ficha de producto pesa **16,2 MB**, y **11,4 MB de eso es un único GIF** alojado en `i.ibb.co`. Un solo archivo que es seis veces el resto de la página entera. Segundo: en esa ficha el pixel **solo dispara `PageView`, nunca `ViewContent`** — Meta sabe que alguien entró, pero no qué producto miró ni cuánto vale, que es justo lo que necesita para buscarte compradores parecidos. Tercero, menor: sigues en el dominio `sowicolombia.myshopify.com`; un dominio propio da más confianza a quien llega de un anuncio.

### viveshop.website
La ficha de producto pesa **9,0 MB, de los que 8,7 MB son imágenes**. La portada, en cambio, va ligera (1,8 MB): el problema está localizado justo en la página donde se decide la compra. Segundo: **no hay ningún enlace de WhatsApp**, y eres la tienda con más versiones de anuncio del lote (49), así que es mucho tráfico sin vía de rescate. La ficha sí muestra valoración y anuncia el pago contra entrega.

### pintatienda.com
La ficha de producto pesa **6,4 MB, de los que 5,75 MB son imágenes** en 44 archivos; la portada va en 2,2 MB. Como en viveshop, el peso está donde más duele. Segundo: **no hay enlace de WhatsApp**. Por lo demás la ficha está bien resuelta: 35 reseñas con Judge.me y pago contra entrega anunciado.

### c6ac4e.myshopify.com
Tienes **tres pixeles de Meta** instalados a la vez (`1844503356033314`, `276933702066332`, `872419677609914`). Tres pixeles no son necesariamente un error, pero medimos algo que sí lo es: en una sola visita a la ficha de producto, el pixel **`872419677609914` manda el evento `ViewContent` dos veces**, mientras que los otros dos lo mandan una. Ese pixel está contando de más, así que sus números de campaña están inflados. Segundo: esa misma ficha pesa **13,9 MB**. Tercero: sigues en `c6ac4e.myshopify.com`, un dominio que ni siquiera lleva el nombre de la marca — es lo primero que lee alguien que llega de un anuncio y no te conoce.

### safeforyourdreamss.com
Es de las tiendas más sanas del lote: la ficha de producto pesa solo **730 KB** y carga en 0,95 s, el pixel dispara `PageView` y `ViewContent`, hay WhatsApp, reseñas y pago contra entrega anunciado. El único hallazgo con números es la portada: **3,7 MB con 60 imágenes**, frente a los 730 KB de la ficha. **Aquí no tenemos un hallazgo de peso que vender**; si acaso, aligerar la portada.

### bestcool.online ⚠️
**La dirección no muestra una tienda.** `www.bestcool.online` sirve una página de Funnelish cuyo título es literalmente *«Parked Domain»* — la plantilla que Funnelish devuelve cuando no hay ningún embudo publicado en ese dominio. Y el dominio raíz, `bestcool.online` sin el `www`, **no tiene ningún registro A**, así que cualquier enlace a la versión corta no abre nada. Con 26 versiones de anuncio activas, conviene verificar a dónde están llevando. **No comprobamos a qué URL apuntan los anuncios**: el embudo real puede estar en otra dirección.

### colchonesspring.com.co ⚠️
**No pudimos cargarla.** El dominio sí resuelve correctamente (`52.8.174.221`), pero el servidor cortó la conexión en **los tres intentos** que hicimos, y en el navegador la portada devolvió una sola petición de 0,2 KB y sin título. **Esto no demuestra que la tienda esté caída**: puede que el servidor rechace conexiones desde fuera de Colombia o desde centros de datos, y que a un comprador en Bogotá le cargue con normalidad. Hay que comprobarlo desde una conexión colombiana antes de decirle nada al dueño.

### nesimu.com
El hallazgo principal es del pixel: en la ficha de producto **solo dispara `PageView`, nunca `ViewContent`**. Meta registra la visita pero no sabe qué producto se miró ni su precio, así que no puede buscarte compradores parecidos ni atribuir bien las ventas. Segundo: **no hay ningún enlace de WhatsApp**. La ficha por lo demás está cuidada: carga en 0,42 s, pesa 2,4 MB, muestra valoraciones y anuncia el pago contra entrega.

### muchi.funnelish.com ⚠️
**La dirección no muestra una tienda**: sirve la misma página *«Parked Domain»* de Funnelish que bestcool.online: mismo título, los mismos 11 archivos desde `img.funnelish.com` y el mismo peso (571 KB). No hay embudo publicado ahí. Su anuncio activo más antiguo lleva 707 días, así que merece una llamada antes que un video. **No comprobamos a qué URL apuntan los anuncios**.

### karamelovirtual.com
Tienes **dos aplicaciones de reseñas instaladas —Yotpo y Okendo— y la ficha de producto no muestra ni una sola reseña**. Estás pagando por herramientas que no se ven: o no hay reseñas publicadas, o el widget no está colocado en la plantilla. Es de las cosas más rentables de arreglar porque la inversión ya está hecha. Segundo: la ficha **no menciona el pago contra entrega** (sí menciona crédito con Addi y Sistecrédito). Tercero: **no hay enlace de WhatsApp**. La velocidad y el peso están bien (0,71 s y 566 KB).

---

## Qué NO pudimos comprobar

- **A dónde llevan los anuncios.** No miramos ni una sola URL de destino. Para `tienda-del-valle.com`, `bestcool.online` y `muchi.funnelish.com` esto es decisivo: sabemos que esas direcciones no sirven una tienda, pero **no sabemos si los anuncios apuntan ahí**. Antes de decirle a nadie que está tirando el dinero, hay que mirar el anuncio.
- **Si hay API de Conversiones.** Es server-side y no se ve desde el navegador. Donde decimos «no se detectó evento de pixel», puede haber medición server-side funcionando. Esto afecta sobre todo a **sacriusshop.store**: lo comprobado es que el pixel de navegador arranca y no envía nada, no que la tienda no mida.
- **`colchonesspring.com.co`.** Resuelve pero no nos respondió en tres intentos. No sabemos si está caída o si rechaza conexiones de fuera. **No se puede afirmar que esté caída.**
- **La ficha de producto de `fantasiasnewyork.com`.** Solo medimos la portada. Nada de lo que decimos de esa tienda se refiere a una ficha de producto.
- **Los tiempos no son dato de campo.** Son una sola medición desde un centro de datos, sin simular 4G ni CPU de gama baja. Al repetirlas, `shop-rebel.co` osciló entre 0,6 s y 21,9 s y `viveshop.website` entre 0,2 s y 10,3 s. **Úsense como comparación entre tiendas, no como el tiempo que mide un cliente real en Colombia.** Para eso hace falta dato de campo.
- **Eventos de carrito y compra.** No añadimos nada al carrito ni iniciamos ningún pago, así que no vimos `AddToCart`, `InitiateCheckout` ni `Purchase`. Que no aparezcan en estas fichas **no es un hallazgo**: es que no los provocamos.
- **Reseñas que cargan tarde.** Damos 6 segundos. Un widget que tarde más podría no aparecer. Por eso en `karamelovirtual.com` decimos que las apps están instaladas y no se ven, que es lo observado, y no que no tenga reseñas.
- **La antigüedad y el número de versiones de anuncio** vienen de los datos que se nos pasaron (medidos el 2026-11-19); no los verificamos. Y son días desde que se publicó el anuncio activo más antiguo, **no días de campaña continua**.
- **Dos referencias previas no cuadraron y conviene saberlo.** Se nos dijo que `blasus.co` pesaba 3,5 MB con 44 imágenes en la portada: medimos **45 imágenes** (coincide) pero **5,6 MB**. Y se nos dijo que su pixel «solo dispara PageView»: medimos también **`ViewContent`**, que la medición anterior no podía ver porque Shopify lo manda por POST. Asimismo, los 6,7–6,9 s de tres fichas de producto eran la espera de 6 segundos sumada al tiempo real; ninguna pasa de 2,2 s.
