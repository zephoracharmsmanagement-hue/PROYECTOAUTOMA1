# Asistente con IA sobre el contenido

Chat que responde dudas del alumno usando **solo** el material de los paquetes a
los que tiene acceso. Vive en `/biblioteca/<paquete>/asistente`.

---

## Por qué la recuperación es léxica y no vectorial

La API de Anthropic **no tiene endpoint de embeddings**. Un índice vectorial
obligaría a contratar un proveedor más (Voyage, OpenAI, Cohere…), con su clave,
su coste y su decisión de vendedor — algo que no corresponde tomar por defecto.

La implementación por defecto usa Postgres: búsqueda de texto completo en
español (`websearch_to_tsquery`) combinada con similitud por trigramas.

|                                                    | Léxica (actual)        | Vectorial                 |
| -------------------------------------------------- | ---------------------- | ------------------------- |
| Proveedores extra                                  | ninguno                | uno (embeddings)          |
| Terminología concreta ("webhook", "pixel", "ROAS") | muy buena              | buena                     |
| Erratas y variantes                                | cubierta por trigramas | buena                     |
| Paráfrasis puramente semántica                     | **débil**              | buena                     |
| Coste por consulta                                 | 0                      | embeddings de la consulta |

La mayoría de lo que pregunta un alumno mientras implementa es terminología
concreta, que es justo donde la búsqueda léxica acierta. La debilidad real está
en preguntas parafraseadas sin compartir vocabulario con el material.

### Cambiar a búsqueda vectorial

Todo pasa por la interfaz `Retriever` (`src/lib/assistant/retriever.ts`), el
mismo patrón que `VideoProvider`. Para migrar:

1. `create extension vector;` y añadir `embedding vector(N)` a `content_chunks`.
2. Implementar `EmbeddingsRetriever` contra el proveedor elegido.
3. Devolverlo desde `getRetriever()`.

Ningún componente de la aplicación cambia.

---

## Cómo se construye el índice

`content_chunks` guarda el material troceado. Se rellena con
`reindex_package_content()`, que se lanza desde el botón **Reconstruir índice**
de la ficha del paquete en el panel.

Fuentes que indexa: descripción del paquete, descripción de cada lección y la
**transcripción** de cada lección (campo nuevo en el editor de temario).

El troceo es **por párrafos**, no por número de caracteres: una transcripción ya
viene separada por ideas, y cortar cada N caracteres parte frases por la mitad y
degrada tanto la recuperación como la respuesta.

Reindexar es una acción explícita y no un disparador al guardar: reescribe todos
los fragmentos del paquete, y hacerlo en cada pulsación de "guardar" sería
trabajo desperdiciado mientras se edita.

---

## Modelo y configuración

| Variable                        | Por defecto     | Qué hace                                                      |
| ------------------------------- | --------------- | ------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`             | —               | Sin ella el asistente queda desactivado y la interfaz lo dice |
| `ASSISTANT_MODEL`               | `claude-opus-5` | Modelo                                                        |
| `ASSISTANT_EFFORT`              | `low`           | Profundidad de razonamiento                                   |
| `ASSISTANT_DAILY_MESSAGE_LIMIT` | `30`            | Tope de preguntas por alumno y día                            |

**Por qué `effort: low`:** las respuestas llegan ya ancladas en fragmentos
recuperados del propio material, así que el trabajo del modelo es explicar lo
que tiene delante, no razonar desde cero. Si en la práctica se queda corto, se
sube con una variable de entorno.

**El razonamiento se deja en adaptativo.** Desactivarlo tiene dos fallos
conocidos en este modelo — fugas de etiquetas internas en la respuesta visible y
llamadas a herramienta escritas como texto en lugar de ejecutarse — y bajar el
esfuerzo consigue el mismo ahorro sin ellos.

**Fallback de servidor activado.** Si el modelo declina una petición por
política, la API la reintenta sola en un modelo de respaldo dentro de la misma
llamada, en lugar de dejar al alumno sin respuesta. Un rechazo llega como
respuesta correcta (HTTP 200) con `stop_reason: "refusal"`, no como excepción,
así que el código lo comprueba antes de dar la respuesta por buena.

---

## Controles de seguridad y coste

**No puede citar lo que no has comprado.** `search_content_chunks()` es
`security definer` pero comprueba `has_package_access` paquete a paquete. Es la
misma regla que protege el vídeo: una sola definición de "tener acceso".

**Tope diario por alumno.** Cada mensaje cuesta dinero real; sin límite, una sola
cuenta puede generar una factura desagradable en una tarde. El contador va por
mensajes de usuario en 24 horas.

**Propiedad de la conversación verificada.** El `conversationId` viaja desde el
cliente y podría apuntar a la conversación de otra persona, así que se comprueba
antes de escribir en ella.

**Las respuestas se guardan aunque el alumno cierre la pestaña**: el consumo ya
se ha producido y debe quedar registrado. Los mensajes solo los escribe el
servidor — `assistant_messages` no tiene política de inserción.

**Historial acotado** a los últimos 8 turnos: cada turno previo se reenvía entero
en cada pregunta, así que la historia es coste recurrente.

**Caché de prompt**: el prompt de sistema es estable byte a byte y lleva
`cache_control`. Lo que cambia por pregunta (los fragmentos) va después, en el
mensaje de usuario — al revés no se cachearía nada.

---

## Límites que conviene conocer

- **El asistente puede equivocarse**, y así se advierte bajo el chat. Las
  instrucciones le prohíben responder fuera del material y le obligan a citar la
  lección, pero ninguna instrucción es una garantía.
- **Sin transcripciones no hay asistente.** Con solo descripciones de lección
  responde de forma muy pobre. La página lo detecta y lo dice en lugar de dejar
  que el alumno lo descubra a base de respuestas vacías.
- **No da consejo legal, fiscal ni financiero** ni promete resultados
  económicos: está en el prompt de sistema, y conviene que siga estándolo.
