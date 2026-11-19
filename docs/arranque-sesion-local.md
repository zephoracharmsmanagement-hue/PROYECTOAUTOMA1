# Mensaje de arranque para la sesión local

Esto es para pegar como **primer mensaje** en la sesión nueva de Claude Code que corre en
el computador. Está escrito en segunda persona, dirigido a esa sesión.

---

Vienes a continuar un trabajo que lleva dos días en una sesión de Claude Code en la nube.
Esa sesión se agotó en alcance, no en contexto: no tenía la extensión de Chrome, ni acceso
a mi computador, ni a mi navegador. Tú sí. Por eso te paso el trabajo.

**Antes de responderme nada, lee estos tres documentos en este orden:**

1. `docs/traspaso-a-sesion-local.md` — el traspaso completo. Empieza aquí.
2. `docs/traspaso-zephora-costo-bot.md` — la medición del costo del bot de WhatsApp.
3. `docs/guion-video-prospeccion.md` — el marco de los videos de prospección y los cuatro
   guiones listos.

Cuando acabes, dime en pocas líneas qué entendiste que está hecho y qué está pendiente, y
espera a que yo confirme antes de ejecutar nada. Si algo de los documentos se contradice
con lo que ves en el repositorio, el repositorio manda y me lo dices.

## Lo que tú puedes hacer y la sesión anterior no

Esto es la razón del traslado. Compruébalo antes de prometerme algo con ello:

- **La extensión de Claude en Chrome.** Mi ElevenLabs, mi Meta Business, mis cuentas. La
  sesión anterior solo tenía la API, y por eso no pudo clonar mi voz.
- **Mi disco y mi terminal.** `ffmpeg` para montar los videos, y `video_pauta.py`, que
  solo corre en Windows.

Si alguna de las dos no responde, dímelo de una en vez de buscarle la vuelta.

## Reglas que no se negocian

Vienen de errores que ya se cometieron. El documento de traspaso las explica una por una
en su §4; aquí están las que más cuestan si se olvidan:

1. **Solo se afirma lo que la ficha demuestra.** Si un hallazgo no está en
   `prospeccion/fichas/<dominio>.json`, no entra a un video. Esto es lo único que separa
   este método de la mensajería masiva de agencia.
2. **Español colombiano.** Nada de voseo: ni «querés», ni «respondés», ni «mandá». Un
   video cuya premisa es «entré yo a tu tienda» se cae si suena a otro país.
3. **Los precios de modelos se verifican con el skill `claude-api`, nunca de memoria.**
   La sesión anterior infló todo un 33% por usar los de Sonnet 4.6.
4. **Nada se publica en la tienda viva de Zephora ni en el workflow activo sin que yo lo
   apruebe.** Es un bot en producción atendiendo clientes.
5. **`proyecto-1` es público.** Cifras de costo, márgenes y precios de la agencia van en
   `PROYECTOAUTOMA1`, que es privado.
6. **En n8n, `update_workflow` guarda pero no publica.** Hay que comprobar
   `versionId` contra `activeVersionId` y publicar con `publish_workflow`.
7. **Cruza teléfono, pixel y marca** entre prospectos antes de escribir un guion. Dos de
   los cinco primeros resultaron ser el mismo dueño y casi se van dos videos al mismo
   número de WhatsApp.

## Lo que NO quiero que hagas

- **No repitas mediciones que ya están en los documentos.** Costaron trabajo y están
  calibradas. Si dudas de una, dime cuál y por qué antes de volver a medir.
- **No reabras decisiones de arquitectura.** Están cerradas y citadas textualmente en el
  §3 del traspaso: plantilla nativa en n8n con Haiku 5.5, modelo BYOK, setup 1.500.000
  COP, mantenimiento 300.000 COP/mes, sin prometer Prompt Caching.
- **No toques el bot de Zephora** hasta que hablemos de las dos correcciones pendientes.

## Dónde está todo

Rama `claude/saas-ecommerce-packages-web-7tbz0e`, ya consolidada:

- `prospeccion/prospectos.json` — 546 prospectos colombianos con dominio propio y gasto
  sostenido en anuncios. Es el activo más valioso del repositorio.
- `prospeccion/fichas/*.json` — 20 auditorías, con `prospeccion/capturas/` (40 PNG).
- `prospeccion/auditoria.js` — el crawler que las produjo.
- `docs/` — los tres documentos de arriba.

Vas a necesitar también `proyecto-1` (la tienda de Zephora) y `bendito-hogar` (que tiene
en `datos/biblioteca/` los 81 archivos crudos de la biblioteca de anuncios de Meta de
donde salieron los 546 prospectos).

## Lo primero que vamos a hacer

Grabar los cuatro videos de prospección. El camino crítico, en orden:

1. Clono mi voz en ElevenLabs — **eso lo hago yo**, porque hay que aceptar una declaración
   de consentimiento sobre mi propia voz. Tú me dices cómo grabar las muestras para que el
   clon sirva, y después lo usas.
2. Grabo las pantallas de las cinco tiendas (son cuatro videos: el guion 2 cubre dos
   tiendas del mismo dueño).
3. Montamos con `ffmpeg`. Esto es lo que te toca a ti.

## Dos cosas que decido yo y todavía no he decidido

Tenlas presentes y recuérdamelas si se me pasan:

- **Si firmo como «Martín»** en los videos. Los cuatro guiones lo dicen y nunca lo
  confirmé.
- **Si uso voz clonada o voz real** para estos primeros cuatro. La sesión anterior me
  recomendó voz real para los primeros y guardar el clon para cuando pase de 4 prospectos
  a 50; no he respondido.

Y una pregunta abierta que importa más de lo que parece: **no he dicho si la pauta de
Zephora está corriendo.** Si está apagada, la prioridad de optimizar el prompt del bot
cambia, porque a dos conversaciones por día cuesta centavos.
