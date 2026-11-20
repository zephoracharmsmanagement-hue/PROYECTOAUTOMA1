# Estrategia de la agencia · borrador 2 · 20 de noviembre de 2026

Análisis completo para decidir a dónde vamos, con qué productos, cómo nos mostramos y cómo lo
hacemos. Se apoya en lo medido en este repositorio (`prospeccion/`, `docs/investigacion-competencia.md`,
`docs/traspaso-zephora-costo-bot.md`), en las herramientas que ya existen en `bendito-hogar`, y en
una segunda investigación de mercado (dolores del cliente, Meta y marco legal) cuyo detalle está en
el §12.

Cada afirmación lleva su estado:
- **Medido** — lo comprobamos nosotros con datos propios.
- **Mercado** — sale de las investigaciones (extractos del buscador: la red no dejó abrir páginas).
- **Supuesto** — razonable pero sin dato todavía.

Los precios que aparecen son **propuestas** ancladas en el mercado. Los fija el dueño.

**Cambios frente al borrador 1:** la prospección por WhatsApp en frío pasa a ser un riesgo serio
(§1 bis); la confirmación de pedidos deja de ser el siguiente producto, porque Dropi ya la incluye;
el diferenciador pasa a ser **señal de entrega + utilidad real**; y aparece la opción de cobrar por
resultado.

---

## 0. La tesis en una frase

**No vendemos bots ni "marketing digital": somos la agencia de las tiendas contraentrega que
pautan en Meta, y nuestro trabajo es encontrar dónde se les va la plata y recuperarla.**

El chat por WhatsApp ya es commodity: Meta tiene su propio agente (Meta Business Agent, expandido
globalmente desde junio de 2026), Dropi tiene el suyo (Chatea PRO) y hay más de cinco SaaS locales
desde 65.000 COP. Lo que no es commodity es saber, tienda por tienda, cuánta plata se pierde entre
el anuncio y la entrega, y arreglarlo.

---

## 1 bis. Antes de todo: la prospección por WhatsApp en frío es un riesgo

Esto cambia cómo mandamos los cuatro videos ya grabados.

- **Política de WhatsApp:** exige opt-in previo; los bloqueos y reportes llevan a advertencias,
  suspensión y baneo del número (Mercado, fuente oficial de WhatsApp).
- **Ley 1581 (habeas data):** los datos corporativos de una persona jurídica quedan fuera, según un
  concepto de la SIC. Pero muchas tiendas de dropshipping son personas naturales o publican el
  celular personal del dueño, y ahí sí aplica.
- **Precedentes:** la SIC sancionó a Movistar con 670 millones (2025) y a Integraservice (2023) por
  mensajes comerciales por WhatsApp sin autorización.
- **Ley 2300 («Dejen de fregar»):** horario de lunes a viernes de 7 a. m. a 7 p. m. y sábados de
  8 a. m. a 3 p. m.; nunca domingos ni festivos. Si aplica o no al contacto entre empresas está en
  discusión.

**El riesgo más probable no es la multa: es que nos baneen el número.** Y quemaría el método antes
de probarlo.

**Formas de contacto más seguras, en orden:**
1. Que el prospecto escriba primero: anuncios que abren WhatsApp, contenido, comunidades.
2. Correo corporativo o formulario de contacto de la tienda, uno a uno, en el horario de la
   Ley 2300, con opción de no recibir más.
3. Si se usa WhatsApp en frío: un solo mensaje manual, uno a uno, desde un número que no sea el de
   operación, en horario hábil y sin secuencias.

**Hace falta un abogado** para: si la Ley 2300 aplica al B2B; si un celular publicado en la web es
dato público o personal; y la política de tratamiento de datos de la agencia.

**Efecto en los guiones:** los cuatro cierran con «me respondes por aquí / a este mismo chat», que
supone WhatsApp. Si el canal cambia a correo, hay que ajustar esa frase y regenerar el final del
audio.

---

## 1. Lo que ya sabemos

### Del cliente (Medido, 19 tiendas auditadas de 546 prospectos)
| Falla | Tiendas | Qué le cuesta |
|---|---|---|
| Sin botón de WhatsApp | 14 de 19 | El que llega del anuncio con una pregunta se va |
| Ficha de producto de más de 5 MB | 7 de 19 | Carga lenta con datos móviles, rebote |
| Sin reseñas visibles | 6 de 19 | Una pagaba **dos** apps de reseñas y no mostraba ninguna |
| Pixel de navegador sin `ViewContent` | 4 de 19 | Meta optimiza sin saber qué producto interesó |
| Pixel sin ningún evento | 1 de 19 | Pauta optimizando a ciegas |
| Pixel que cuenta doble | 1 | Métricas infladas, decisiones con datos falsos |
| Dominio por defecto de Shopify | 2 de 19 | Menos confianza al llegar del anuncio |

### Del mercado (Mercado)
- **Devoluciones en contraentrega:** las cifras que circulan van de 15 % a 45 % según el nicho y la
  fuente. Dropi cita 45 % de promedio del mercado y 73 % de entrega en su operación. **Casi todas
  las fuentes venden una solución**, así que son cifras interesadas.
- Cada devolución cuesta de 15.000 a 35.000 COP solo en logística, más la pauta pagada por ese
  pedido. Con 70 % de entrega, el costo por pedido entregado sube cerca de 43 %.
- Costo por compra en Meta: 15.000 a 45.000 COP. Se recomienda renovar creativos cada 7 a 14 días.
- **Dropi ya incluye confirmación** por llamada automática y WhatsApp, y su empresa hermana
  Chatea PRO vende el agente IA con integración nativa.
- Bot de WhatsApp con IA: saturado. Setup de 420.000 a 5.400.000 COP, mensualidad de 299.000 a
  1.400.000; SaaS desde 19.900.
- Auditoría técnica en Colombia: 800.000 a 2.500.000 COP (Zeroazul).
- **Meta cobra los mensajes de servicio desde el 1 de octubre de 2026**, con 1.000 gratis al mes
  por número. Una tienda del tamaño de Zephora (~230 mensajes al mes) queda dentro del cupo gratis.
- Video de auditoría personalizado: nadie en Colombia ni LatAm.

### De nosotros (Medido: herramientas que ya existen y funcionan)
| Capacidad | Herramienta | Dónde |
|---|---|---|
| Auditoría móvil de tiendas (pixel, peso, WhatsApp, reseñas) | crawler | `prospeccion/auditoria.js` |
| Prospección: anunciantes con pauta sostenida | escáner de la biblioteca de anuncios de Meta | `bendito-hogar/herramientas/biblioteca-*.js` |
| Investigación de producto ganador | mismo escáner + resumen por días activos | `biblioteca-resumen.py` |
| Catálogo, flete y cobertura contraentrega de Dropi | 10 scripts de solo lectura | `bendito-hogar/herramientas/dropi-*.js` |
| Economía por producto (pauta máxima por pedido sin perder) | calculadora | `economia.py` |
| Creativos con IA: escenas, infografías, videos 9:16 y 4:5 con voz y subtítulos | generadores | `creativos_kie.py`, `video_pauta.py`, `video_vertical.py`, `video_real.py` |
| Tienda completa con páginas legales colombianas (Ley 1480, 1581) | generador de sitio | `generar-sitio.mjs`, `legal.mjs` |
| Vendedor IA por WhatsApp en producción | workflow n8n | Zephora |
| Voz clonada para videos | ElevenLabs | «Martin Daza» |
| Plataforma para vender cursos, plantillas y membresía | **Automa** (este repositorio) | Next.js + Supabase + Stripe |

**Lectura:** ya tenemos casi todo lo que necesita una agencia completa para tiendas contraentrega.
Lo que falta es empaquetarlo, ponerle precio y conseguir los primeros clientes.

---

## 2. Los dolores del cliente, ordenados por plata

| # | Dolor | Evidencia | Quién lo ataca |
|---|---|---|---|
| 1 | **Pedidos que no se entregan** (no confirman, dirección errada, «no contesta», rechazo) | Mercado: 15–45 % de devolución; 4 de cada 10 que confirman corrigen la dirección | Dropi (incluido), Chatea PRO, Talkyria (cobra por confirmación exitosa), WASY, apps de Shopify |
| 2 | **No saben su utilidad real** después de devoluciones, flete, comisión y pauta | Mercado: el panel de Dropi no muestra el gasto en Meta; ninguna encuesta lo mide | Lumy se acerca; las apps genéricas no conocen la contraentrega |
| 3 | **Meta optimiza por pedidos que nunca pagan** | Medido (6 de 19 con pixel roto) + lógica: el pixel cuenta el pedido, no la entrega | **Nadie lo resuelve de forma documentada** |
| 4 | **Fatiga de creativos** | Mercado: renovar cada 7–14 días; un video UGC cuesta 90.000–850.000 COP | Agencias UGC desde 1,4 M/mes, cursos |
| 5 | **Tienda que convierte mal** | Medido | Agencias Shopify |
| 6 | **Elegir producto** en un mercado saturado | Mercado: Colombia es el país de LatAm con más competencia por venta | Dropkiller, DropWinner, Minea |
| 7 | **Bloqueos de cuentas publicitarias** | Mercado: quejas de una ola de bloqueos por IA en 2026 | Solo cursos «anti-baneo» |
| 8 | **Devoluciones injustificadas** (la transportadora registra intentos que el cliente niega) | Mercado: un operador recuperó ~73 % reclamando, 22 días por reclamo | Solo guías; nadie lo vende como servicio |
| 9 | **Atención y postventa** | Mercado | Todos los bots |

---

## 3. Qué queda libre

Lo que el mercado ya resuelve bien, o lo da gratis la plataforma del cliente, no lo vendemos
aislado: confirmación básica, chat de atención, investigación de producto por suscripción.

**Lo que nadie resuelve bien, y es nuestro espacio:**
1. **Señal de entrega a Meta.** Mandarle a Meta por la API de conversiones solo los pedidos
   confirmados o entregados, para que la campaña busque gente que sí recibe y paga. Nadie lo ofrece
   de forma documentada. **No hay evidencia publicada de que funcione mejor: hay que probarlo con
   nuestras tiendas antes de venderlo.**
2. **Utilidad real conciliada.** Cruzar Shopify, Dropi (entregas, devoluciones, cobros) y el gasto
   en Meta por producto, ciudad y transportadora. Con eso se decide qué escalar y qué ciudades
   excluir.
3. **Reclamo de devoluciones injustificadas** como servicio.
4. **Cumplimiento legal de la tienda** (Ley 1480, 1581 y 2300) empaquetado. Ya tenemos `legal.mjs`.
5. **Diagnóstico con evidencia por tienda** antes de vender nada.

### Lo que copiamos de los competidores
| Lo que hacen bien | Quién | Qué copiamos |
|---|---|---|
| Cobro por resultado («pagas cuando entregas», «solo por confirmación exitosa») | Dropi, Talkyria | Una parte del precio atada a la mejora medida (§6) |
| Freemium para entrar | WASY | El video o el diagnóstico gratis |
| Precios públicos en blogs | Zeroazul, Ventiva | Publicar precios |
| Comunidades y contenido como embudo | Chatea PRO (Skool), Dropi Academy, mentores | Contenido con datos propios (§7) |

---

## 4. A dónde vamos y cómo nos mostramos

- **Especialistas, no generalistas.** Tiendas contraentrega en Colombia que pautan en Meta.
- **Operadores, no teóricos.** Tenemos tiendas propias y usamos con ellas las mismas herramientas
  que vendemos. Se puede decir porque es cierto; **los resultados de esas tiendas no se publican
  hasta medirlos**.
- **Primero la evidencia.** Nunca vendemos sin mostrar antes qué está mal, con datos de su tienda.
- **Nuestro número no es el pedido: es el pedido entregado.** Es la frase que nos separa de todos
  los que venden bots.
- **Cómo se ve:** dominio propio, página con precios públicos, el método explicado y un ejemplo real
  de hallazgo. Firma «Martín, de [empresa]». **El nombre sigue pendiente**; este repositorio ya se
  llama **Automa**.

---

## 5. El menú: una agencia completa

| Línea | Servicio | Dolor | Hoy |
|---|---|---|---|
| **Diagnóstico** | Video de 90 s con 2–3 hallazgos | Todos | **Sí** |
| | Diagnóstico de fugas: tienda + pixel + tasa de entrega (con datos de Dropi del cliente) | 1, 2, 3 | **Casi**: falta leer los datos de Dropi del cliente |
| **Tienda** | Puesta a punto: peso, WhatsApp, reseñas, contraentrega visible, dominio | 5 | **Sí** |
| | Tienda nueva lista para vender, con páginas legales colombianas | 5 | **Sí** |
| **Medición y rentabilidad** | Arreglo del pixel con antes y después | 3 | **Sí** |
| | **Señal de entrega a Meta** (API de conversiones con pedidos entregados) | 1, 3 | **No**: construir y probar primero en nuestras tiendas |
| | **Tablero de utilidad real** (Meta + Shopify + Dropi) y ciudades a excluir | 1, 2 | **No**: construir. Es el producto diferenciador |
| **Creativos** | Paquete mensual de anuncios: escenas, infografías, videos con voz | 4 | **Sí** |
| | Investigación de producto con la biblioteca de anuncios | 6 | **Sí** |
| **Operación contraentrega** | Gestión de novedades y recuperación de «no contesta», conectada a Dropi | 1 | **Con trabajo** |
| | Reclamo de devoluciones injustificadas | 8 | **Con trabajo** |
| | Vendedor IA por WhatsApp | 9 | **Sí** (Zephora), pero no se vende aislado |

**Fase 2:** pauta gestionada, y formación en Automa como producto de entrada barato.

**Regla para no dispersarnos:** el menú muestra la agencia completa, pero **se vende primero una
sola cosa** (diagnóstico → puesta a punto) y lo demás se construye en el orden en que los clientes
lo pidan.

---

## 6. Entrar barato sin parecer barato

1. **Precio de lista público, y el descuento con nombre y razón.** «Precio fundador» para los
   primeros cinco clientes, a cambio de publicar su caso con números.
2. **Gratis solo lo que demuestra, nunca rebajar lo que se entrega.**
3. **Garantía sobre lo que controlamos.** «Si después del arreglo tu pixel no reporta los eventos,
   te devolvemos el dinero.» Nunca garantizar ventas.
4. **Entregables con evidencia:** informe de antes y después en cada trabajo.
5. **Nunca competir con el bot de 80.000.** Si el cliente solo quiere un bot, no es nuestro cliente.
6. **Cobro atado al resultado en lo recurrente.** Los competidores ya cobran por confirmación o por
   entrega. Una base baja más un valor por cada punto de tasa de entrega que suba sobre la que el
   cliente tiene hoy alinea el precio con su plata y nos aleja de la imagen de barato. Exige medir
   la línea base con sus datos de Dropi, y esa medición es también el diagnóstico.

### Escalera de precios (propuesta)
| Escalón | Qué es | Precio de lista | Precio fundador | Ancla de mercado |
|---|---|---|---|---|
| 0 | Video diagnóstico | Gratis | — | Nadie lo hace aquí |
| 1 | Diagnóstico de fugas, **abonable** al trabajo | 250.000 | Gratis para los fundadores | — |
| 2 | Puesta a punto (tienda + pixel) | 1.800.000 | 900.000 | Auditoría 800.000–2.500.000 |
| 3 | Plan mensual: utilidad real + señal de entrega + creativos | Base + variable por mejora de entrega | Por definir | Soporte desde 500.000; UGC desde 1,4 M |
| 4 | Vendedor IA por WhatsApp (ya cerrado) | 1.500.000 + 300.000/mes | — | Setup 420.000–5.400.000 |

El escalón 3 queda sin cifra a propósito: hay que medir cuánto tiempo nos toma por cliente y probar
la señal de entrega en nuestras tiendas antes de fijarlo.

---

## 7. Un paso adelante

1. **El chat se vuelve gratis.** El valor se mueve a lo que está detrás: la entrega y la utilidad.
2. **Gana quien tenga los datos.** Con los 546 prospectos y el escáner podemos publicar el
   **«Estado de las tiendas contraentrega en Colombia»**: fallas agregadas y anónimas. Nadie más
   tiene ese dato, y además es la forma de que los prospectos nos escriban primero (§1 bis).
3. **Los creativos se vuelven volumen.** Producirlos con IA a costo bajo ya lo tenemos montado.
4. **Apuesta a vigilar, no a vender:** que los asistentes de IA recomienden y vendan productos.

---

## 8. Qué hay que verificar

| # | Qué | Estado |
|---|---|---|
| 1 | Prospección por WhatsApp en frío | **Investigado: riesgo real** (§1 bis). Falta decidir el canal y consultar un abogado |
| 2 | Agente nativo de Meta | **Investigado: existe** desde 2026, ~US$0,04–0,05 por mensaje por API. Su disponibilidad oficial en Colombia no se confirmó |
| 3 | Cobro de mensajes de servicio desde octubre | **Investigado: sí**, con 1.000 gratis al mes por número |
| 4 | Tasa real de pedidos no entregados | Mercado: 15–45 %, con fuentes interesadas. **El dato bueno es el de nuestras tiendas en Dropi** (requiere autorizar el conector de Dropi) |
| 5 | Si la señal de entrega a Meta mejora la campaña | **Nadie lo ha publicado.** Probar en nuestras tiendas |
| 6 | Precios de competidores en sus páginas completas | Falta: la red no deja abrir páginas |
| 7 | Que los clientes respondan | El experimento de los videos, con el canal que se decida |

## 9. Qué hay que decidir

1. **El nombre de la empresa.** ¿Es Automa?
2. **El canal para mandar los videos**: correo o formulario, WhatsApp manual uno a uno, o esperar a
   que escriban primero.
3. **Los precios de lista y fundador** de los escalones 1 y 2.
4. **Si se prueba la señal de entrega y el tablero de utilidad en nuestras tiendas** como próximo
   producto.

---

## 10. Cómo lo hacemos: 90 días

| Cuándo | Qué | Meta medible |
|---|---|---|
| Semana 1 | Nombre, dominio y página con precios. Decidir canal de contacto (y abogado). Ajustar el cierre de los videos al canal. Mandar los cuatro | 4 enviados |
| Semanas 2–4 | 20 contactos más. Primeras puestas a punto con antes y después. En paralelo, sacar de Dropi la tasa de entrega de nuestras tiendas | 3 clientes fundadores · línea base propia |
| Mes 2 | Construir el tablero de utilidad y la señal de entrega, y probarlos en nuestras tiendas | Resultado medido en tienda propia |
| Mes 3 | Publicar el informe «Estado de las tiendas». Ofrecer el plan mensual a los fundadores. Paquete de creativos | 3 clientes mensuales |

**Métricas que importan:** tasa de respuesta, porcentaje que paga, días de entrega, mejora medida
por cliente (antes y después), tasa de entrega de los clientes y cuántos siguen el segundo mes.

---

## 11. Qué cubre Claude Max y qué no

- **Sí cubre** el trabajo de la agencia: auditorías, código, tiendas, guiones, análisis e informes,
  hecho por nosotros con Claude, dentro de los límites de uso del plan.
- **No cubre** lo que corre solo para el cliente las 24 horas (vendedor IA, gestión de novedades,
  señal de entrega). Eso va por la API, y por eso el modelo ya decidido es que el cliente pague su
  propio consumo. **Confirmar en los términos de uso de Anthropic** antes de ofrecerlo.
- **Costos aparte:** imágenes (Kie), voz (ElevenLabs), n8n, mensajes de WhatsApp sobre el cupo
  gratis, dominio y Shopify del cliente.

---

## 12. Fuentes de la segunda investigación (selección)

Todas vienen de extractos del buscador. [O] fuente oficial, [O\*] la empresa hablando de su propio
producto, [T] terceros.

- Meta Business Agent: https://about.fb.com/news/2026/06/meta-business-agent/ [O] · precio por API:
  https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages [O] ·
  Meta One: https://about.fb.com/news/2026/09/introducing-meta-one-subscription-service-more-features-ai/ [O] ·
  disponibilidad por país: https://faq.whatsapp.com/2112106596314330 [O]
- Cobro de mensajes de servicio: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing [O]
- Opt-in y baneos: https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in [O] ·
  https://faq.whatsapp.com/5957850900902049 [O]
- Datos corporativos fuera de la Ley 1581:
  https://sedeelectronica.sic.gov.co/boletin-juridico/conceptos/ambito-de-aplicacion-de-la-ley-1581-de-2012-en-datos-corporativos [O] ·
  sanción a Movistar: https://www.infobae.com/colombia/2025/10/29/sic-sanciono-a-movistar-por-violar-la-ley-de-proteccion-de-datos-personales/ [T] ·
  sanciones 2023: https://www.sic.gov.co/sanciones-proteccion-datos-personales-2023 [O]
- Ley 2300: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=213990 [O] · alcance B2B:
  https://normograma.crcom.gov.co/crc/compilacion/docs/concepto_crc_0527490_2024.htm [O]
- Devoluciones: https://dropi.co/cr/logistica-inteligente [O\*] · https://talkyria.com/blog/dropshipping-contra-entrega-como-funciona [T, interesado] ·
  https://blog.envioclick.com/pago-contra-entrega-en-colombia-por-que-cada-rechazo-te-cuesta-mas-de-lo-que-ganaste/ [T]
- Confirmación incluida en Dropi: https://dropi.co/vende-contraentrega [O\*] · Chatea PRO: https://dropi.co/chatea-pro [O\*]
- Utilidad real: https://www.lumy.casa/blog/reporte-de-rentabilidad-para-dropi [O\*]
- Saturación: https://www.dropkiller.com/blog/estudio-dropshipping-cod-latam-2026 [O\*]

**Sesgo de fuentes:** gran parte de la evidencia sobre contraentrega viene de un solo autor que es
afiliado de Dropi y fundador de Talkyria. No se encontró ninguna fuente independiente (Fenalco,
CCCE, MinTIC) con la tasa de devolución.
