# Traspaso a una sesión local · todo el contexto de la sesión en la nube

**Para:** la sesión nueva de Claude Code que corre en el computador de Windows.
**De:** la sesión en la nube `session_011pBmQpQ8q8theXGXCJtupL`, 18–19 de noviembre de 2026.
**Léelo completo antes de tocar nada.** Está escrito para que no haya que volver a
preguntar ni a medir lo que ya se midió.

---

## 0. Por qué el traslado, y qué se gana

La sesión en la nube corre en un contenedor aislado. No tiene la extensión de Claude en
Chrome, ni control del computador, ni acceso al navegador donde el dueño está logueado.
Eso bloqueó tres cosas concretas:

| Bloqueado en la nube | Por qué | Lo resuelve una sesión local |
|---|---|---|
| ElevenLabs más allá de la API | Las herramientas de la API no clonan voz desde audio; la app sí | Chrome con la sesión abierta |
| `video_pauta.py` | Solo corre en Windows | Es el disco local |
| Montaje de los videos | Necesita `ffmpeg` sobre archivos locales | Es el disco local |

Lo que **no** cambia con el traslado: el clonado de voz sigue necesitando que el dueño
suba sus muestras y acepte la declaración de consentimiento. Esa afirmación es de la
persona dueña de la voz. Ni la sesión local ni ninguna otra la firma por él.

---

## 1. Cómo arrancar la sesión local

1. **Clona el repositorio** en el computador:
   ```
   git clone https://github.com/zephoracharmsmanagement-hue/PROYECTOAUTOMA1
   cd PROYECTOAUTOMA1
   git checkout claude/saas-ecommerce-packages-web-7tbz0e
   ```
   Esa rama trae **todo**: los dos documentos de traspaso, las 546 fichas de prospectos,
   las 20 auditorías, las 40 capturas y los guiones. Ya está consolidada: no hace falta
   buscar en otras ramas.

2. **Abre Claude Code en esa carpeta.** Desde la app de escritorio (Claude Code → abrir
   carpeta) o desde la terminal con `claude` dentro del directorio.

3. **Primer mensaje a la sesión nueva**, literal:
   > Lee `docs/traspaso-a-sesion-local.md` completo y luego
   > `docs/traspaso-zephora-costo-bot.md` y `docs/guion-video-prospeccion.md`.
   > Son el contexto de una sesión anterior. No repitas mediciones que ya están ahí.

4. **Verifica que la extensión de Chrome responda** antes de prometer nada con ella.

5. **Repositorios adicionales** que la sesión anterior tenía en disco y que la local va a
   necesitar:
   - `proyecto-1` — la tienda de Zephora. **Es público**: no se escriben ahí cifras de
     costo, márgenes ni precios de la agencia.
   - `bendito-hogar` — contiene en `datos/biblioteca/` los 81 archivos crudos de la
     biblioteca de anuncios de Meta de donde salieron los 546 prospectos.

---

## 2. Las dos líneas de trabajo

### A. Zephora · el costo del bot de WhatsApp — medido, desplegado, con un problema abierto

Todo el detalle está en `docs/traspaso-zephora-costo-bot.md` (revisión 3). El resumen:

- **Workflow n8n** `74TjEtDnn940jh9k` — «Zephora · Asesora de WhatsApp», activo en producción.
- **Causa raíz medida:** la herramienta `disponibilidad` devolvía el catálogo completo,
  53.352 caracteres = 26.204 tokens, y el agente lo arrastra en cada iteración del
  mismo mensaje.
- **Se desplegó un filtro** (`grupo` e `ids`) vía PR #53 en `proyecto-1`. Está vivo y
  verificado en producción.
- **Y salió peor:** la primera medición posterior (n=4) dio **0,214 USD por mensaje**
  contra una línea base de **0,135**, o sea 59% más caro. Causa sospechada: el bot
  pasó de una llamada gorda a tres llamadas flacas en el mismo mensaje. **Sin resolver.**

**Las dos correcciones candidatas, diseñadas y NO aplicadas** (requieren visto bueno del
dueño porque es el bot en producción):
- (a) añadir al `toolDescription` que pida todo en **una sola** llamada, porque `grupo` e
  `ids` se suman;
- (b) que la función acepte `grupo` con varios grupos separados por coma — otro PR en
  `proyecto-1`.

**Tarea programada pendiente:** `trig_01F863yHgNWYwGqsS5m7anGz` dispara el 19 de
noviembre a las 21:34 UTC para la segunda medición, y está atada a **la sesión en la
nube**, no a la local. Si para entonces la sesión local ya está en marcha, hay que
rehacerla ahí o leer el resultado en la de la nube.

#### Los tres principios que costaron trabajo descubrir y que NO hay que volver a derivar

1. **El piso por iteración manda.** Unos **20.319 tokens** (prompt de sistema ~13.400 +
   esquemas de herramientas y andamiaje de LangChain ~6.900) se reenvían en **cada**
   iteración del agente. Cualquier optimización que arriesgue una iteración extra es
   pérdida neta. Por eso quitar las fotos (35,5% del payload) saldría **48% más caro**,
   y por eso el filtro, al multiplicar las llamadas, salió más caro.
2. **La calibración real es 2,036 caracteres por token**, no el `caracteres ÷ 4` que
   usa n8n. Medido: 53.352 caracteres = 26.204 tokens.
3. **El caché no se puede activar** en el nodo `lmChatAnthropic` v1.5: la opción no existe.

#### Precios verificados (no de memoria — vienen del skill `claude-api`)

| Modelo | Entrada | Salida |
|---|---|---|
| `claude-sonnet-5` (el que corre el bot) | 2 USD / MTok | 10 USD / MTok |
| `claude-haiku-5-5` | 0,10 USD / MTok | 0,50 USD / MTok |

### B. La agencia · motor de prospección — 546 prospectos, 20 auditados, 5 guiones listos

- **`prospeccion/prospectos.json`** — 546 prospectos colombianos con dominio propio y 30+
  días desde el inicio de su anuncio activo más antiguo. Salieron de 75 búsquedas de la
  biblioteca de anuncios de Meta, 4.222 anuncios, 1.883 anunciantes.
  **Ojo con el campo `dias_pauta`:** es la antigüedad del anuncio activo más viejo, **no**
  una campaña continua. Que siga activo es señal de gasto sostenido, pero nunca se dice
  «lleva X días de campaña seguida».
- **`prospeccion/fichas/*.json`** — 20 auditorías completas, con `prospeccion/capturas/`
  (portada y ficha de producto de cada una, 40 PNG).
- **`prospeccion/auditoria.js`** — el crawler definitivo. **`auditoria-prototipo.js`** es
  el prototipo, más corto, útil para leer la lógica.
- **`docs/guion-video-prospeccion.md`** (revisión 2) — el marco de los 90 segundos y los
  cinco guiones de los cinco mejores prospectos.

#### Los elegidos y su duración medida

| # | Prospecto | Caracteres de locución | Duración |
|---|---|---|---|
| 1 | tiendamultimarca.com.co | 1.070 | ~82 s |
| 2 | sowicolombia.myshopify.com **+** c6ac4e.myshopify.com | 1.045 | ~86 s |
| 3 | sacriusshop.store | 1.079 | ~87 s |
| 4 | karamelovirtual.com | 1.057 | ~85 s |
| | **Total** | **4.251** | |

**Son cuatro videos, no cinco, y eso se corrigió el 19 de noviembre al escribir este traspaso.**
`sowicolombia.myshopify.com` y `c6ac4e.myshopify.com` **son del mismo dueño**: comparten el
WhatsApp `573001396755` y las dos fichas de producto llevan la marca «SOWI». Mandarle dos videos
distintos, cada uno abriendo con «entré a tu tienda», lo habría destruido todo. Van fusionados en
el guion 2, y el video queda **más** fuerte: haber visto las dos tiendas prueba que lo miró una
persona.

**El quinto puesto está libre y el candidato está identificado:** `fantasiasnewyork.com`, 201 días
de anuncio activo y **45 versiones** (la segunda cifra más alta del lote). Su pixel
`839855401097678` dispara `PageView` y **nunca `ViewContent`**, y no tiene botón de WhatsApp. Dos
hallazgos limpios. **El guion no está escrito** — es trabajo para la sesión local.

#### Una advertencia sobre la trazabilidad de las cifras

Los pesos **por archivo** (los «tres GIFs de 7,3 + 5,8 + 2,0 MB», el «GIF de 11,4 MB») **no están
en los JSON de las fichas**: los JSON solo traen agregados (`kb_transferidos`, `kb_por_tipo`).
Esas cifras están en `prospeccion/RESUMEN.md`, el informe narrativo del crawler. Antes de afirmar
un peso por archivo en un video, **vuelve a medirlo**, porque la evidencia legible por máquina no
lo respalda. Los agregados sí cuadran: sowicolombia son 15,8 MB de ficha con 15,4 MB de imágenes,
y `i.ibb.co` (donde vive el GIF) cargó bien, con `red_limpia_para_el_pixel: true`.

---

## 3. Decisiones ya tomadas · no volver a abrirlas

### Arquitectura de los primeros clientes (cerrada por el dueño, textual)

> «Para nuestros primeros clientes usaremos la plantilla nativa en n8n con Haiku 5.5
> (sin prometer Prompt Caching en la propuesta), ya que a 0,05 USD por conversación es
> sumamente económico para el cliente y nos permite desplegar rápido. Solo construiremos
> la versión con llamadas HTTP directas y caché más adelante si entra un cliente de
> altísimo volumen.»

- **Modelo BYOK**: el cliente paga su propio consumo de API con su tarjeta, con recarga
  automática y un tope mensual de seguridad configurados en el onboarding.
- **Setup 1.500.000 COP**, entrega en 2–3 días, y **arranca solo** cuando el portafolio
  de Meta/WhatsApp del cliente está sano. La limpieza técnica se cotiza aparte.
- **Mantenimiento 300.000 COP/mes.**

### El español tiene que ser colombiano

Está como §0 bis del documento de guiones, y es una regla, no una preferencia. Nada de
voseo argentino: ni «querés», ni «respondés», ni «buscás», ni «mandá», ni «decí».
Un video de prospección cuya premisa es «entré yo a tu tienda» se cae entero si suena
a otro país.

### Solo se afirma lo que la ficha demuestra

Regla del dueño para los videos. Si el hallazgo no está en el JSON de la auditoría, no
entra al guion. Es lo que distingue este método de la mensajería masiva de agencia.

---

## 4. Los errores que ya se cometieron · no repetirlos

Esta lista vale más que casi todo lo demás. Cada uno se detectó **antes** de llegar a un
prospecto o a producción, y cada uno costó trabajo.

1. **Precio inflado 33%.** Se calculó todo a 3/15 USD por MTok — ese es el precio de
   Sonnet 4.6. El bot corre `claude-sonnet-5`, que es **2/10**. Se corrigió en toda la
   revisión 3. **Verifica precios con el skill `claude-api`, nunca de memoria.**
2. **Un buscador de texto habría sido una regresión.** La especificación inicial incluía
   un parámetro `q`. El caso que lo mató: la clienta pide una «libélula», la pieza se
   llama *Luciérnaga Evangeline*, `?q=libelula` devuelve cero, y el prompt entonces le
   hace declarar agotado el producto y registrar un reabastecimiento. Retirado.
3. **`update_workflow` guarda pero no publica.** `versionId != activeVersionId`. El bot
   seguía corriendo la versión vieja. **Siempre comprobar y publicar con
   `publish_workflow`.**
4. **Once tiendas parecían no tener pixel y sí lo tenían.** Shopify manda el evento por
   **POST**, no en la URL. De ahí la regla: decir siempre «tu pixel **de navegador**»,
   nunca «tu pixel», porque la Conversions API es de servidor y es invisible desde fuera.
5. **«6,7 segundos» nunca existió.** Ese número incluía los 6 segundos de espera que el
   propio script añadía. Ninguna ficha de producto pasa de 2,2 s. Mató el segmento del
   cronómetro, que era el centro del guion, y lo reemplazaron dos anclas reales: el botón
   de WhatsApp ausente (14 de 19 tiendas auditables) y señalar un archivo concreto
   demasiado pesado.
6. **Voseo argentino en los guiones.** Salió de un subagente. Dos pasadas para limpiarlo.
7. **Dos tiendas del mismo dueño entre los cinco guiones.** `sowicolombia` y `c6ac4e` comparten
   el WhatsApp `573001396755` y la marca «SOWI». Se detectó solo al cruzar los teléfonos de las
   20 fichas, ya con los guiones escritos. **Cruza siempre teléfonos, pixeles y marca entre los
   prospectos elegidos antes de escribir un guion.** De las 20 fichas es el único par que
   colisiona, pero con 546 prospectos en la lista va a volver a pasar.
8. **La cifra del WhatsApp estaba desactualizada.** El documento de guiones decía «12 de las 16
   tiendas auditables»; medido contra las fichas definitivas son **14 de 19**. Venía de antes de
   que el crawler se volviera a correr por el asunto del pixel. Corregido.
9. **Dos errores de lectura de dígitos.** El pixel de c6ac4e termina en **9914** (cuatro
   dígitos), y los IDs se leen dígito por dígito, no como número. **Verifica cada cifra
   contra el JSON crudo de la ficha antes de grabar.**

---

## 5. Estado de ElevenLabs · medido el 19 de noviembre

| | |
|---|---|
| Plan | `starter`, activo |
| Slots de voz instantánea | **10 disponibles, 0 usados** |
| Slots de voz profesional | **0** — requiere plan superior |
| Créditos | 6.171 de 39.577 usados → **33.406 libres** |

Los cuatro guiones completos cuestan ~4.251 créditos, el 13% de lo que queda del mes.
Alcanza para cuatro o cinco tomas de cada uno.

**Advertencia para la sesión local:** el dueño dice tener la versión paga y tiene razón
—`starter` es un plan pago—, pero el conector de la API reporta `professional_voice_limit: 0`.
Si en la app ve capacidades que el conector no muestra, lo más probable es que **la clave
de la API apunte a otro workspace** del que usa para entrar. Vale la pena comprobarlo
antes de concluir que algo no se puede.

**Recomendación que la sesión anterior dejó sobre la mesa y el dueño no ha respondido:**
clonar la voz sí (es gratis y son 10 slots), pero grabar los cinco primeros videos con
voz real. Son unos 7 minutos de hablar en total, hay que grabar la pantalla de todas
formas, y una locución sintética con prosodia plana se lee como producción en masa ante
dueños de tienda que reciben veinte mensajes de agencia por semana. El clon rinde cuando
se pase de 5 prospectos a 50.

---

## 6. Pendientes, en orden

### Camino crítico para grabar los videos
1. **Confirmar la firma.** Los cinco guiones dicen «Soy Martín». **Nunca se confirmó.**
2. **Clonar la voz** en la app de ElevenLabs (Instant Voice Clone). Las muestras se graban
   leyendo el guion 1 con el mismo micrófono, cuarto y tono de los videos: el clon copia
   el registro, no solo el timbre.
3. **Grabar las pantallas** de las cinco tiendas desde celular — en cuatro videos, porque el
   guion 2 cubre dos tiendas del mismo dueño.
4. **Montar** con `ffmpeg` — esto es lo que desbloquea la sesión local.

### Zephora
5. **Segunda medición** del filtro (tarea `trig_01F863yHgNWYwGqsS5m7anGz`).
6. **Aplicar las correcciones (a) y (b)** si la medición las confirma — con visto bueno.
7. **§3.4: adelgazar el prompt de sistema** — 31%, es la palanca más grande de todas.
   Diseñado, no empezado.

### Varios
8. **`video_pauta.py`**: quitarle la banda de precio. Solo corre en Windows.
9. **Escribir el guion 5** para `fantasiasnewyork.com` (datos arriba), y auditar más prospectos
   de los 546 si los cuatro primeros funcionan.

### La pregunta que nunca se respondió
10. **¿Está corriendo la pauta de Zephora?** Hubo ~2 conversaciones en 6,5 horas. Se
    preguntó dos veces. Importa porque a ese volumen el bot cuesta centavos al día: la
    optimización del costo vale para **los clientes**, no para Zephora. Si la pauta está
    apagada, la prioridad del punto 7 cambia.

---

## 7. Restricciones que siguen vigentes

- **Visto bueno del dueño** antes de publicar cualquier cosa en la tienda viva de Zephora
  o en el workflow activo.
- **`proyecto-1` es público.** Cifras de costo, márgenes y estrategia de precios van en
  `PROYECTOAUTOMA1`, que es privado. Por eso los dos documentos de traspaso viven aquí.
- **Nunca** el correo ni los datos personales del dueño en peticiones a servicios externos.
- **Nunca** una afirmación en un video de prospección que la ficha no demuestre.
