# Estrategia de la agencia · borrador 1 · 20 de noviembre de 2026

Análisis completo para decidir a dónde vamos, con qué productos, cómo nos mostramos y cómo lo
hacemos. Se apoya en lo medido en este repositorio (`prospeccion/`, `docs/investigacion-competencia.md`,
`docs/traspaso-zephora-costo-bot.md`) y en las herramientas que ya existen en `bendito-hogar`.

Cada afirmación lleva su estado:
- **Medido** — lo comprobamos nosotros con datos propios.
- **Mercado** — sale de la investigación de competencia (extractos del buscador; ver ese documento).
- **Supuesto** — razonable pero sin dato todavía. Hay que verificarlo.

Los precios que aparecen son **propuestas** ancladas en el mercado. Los fija el dueño.

---

## 0. La tesis en una frase

**No vendemos bots ni "marketing digital": somos la agencia de las tiendas contraentrega que
pautan en Meta, y nuestro trabajo es encontrar dónde se les va la plata y recuperarla.**

El chat por WhatsApp se está volviendo commodity (hay seis proveedores colombianos con precio
público, uno freemium apuntándole a nuestro mismo cliente, y Meta lanzando su propio agente). Lo que
no es commodity es saber, tienda por tienda, cuánta plata se pierde y en qué punto exacto, y tener
las herramientas para arreglarlo rápido. Eso ya lo hacemos para nuestras propias tiendas.

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

**Lectura:** las tiendas que pautan meses seguidos tienen fallas básicas y caras. No son tiendas
abandonadas: son negocios activos que no tienen a nadie revisando la parte técnica.

### Del mercado (Mercado)
- Bot de WhatsApp con IA: saturado. Setup de 420.000 a 5.400.000 COP, mensualidad de 299.000 a
  1.400.000; SaaS desde 19.900.
- Auditoría técnica en Colombia: 800.000 a 2.500.000 COP (Zeroazul).
- Confirmación de pedidos contraentrega: la ofrecen ~7 competidores de nicho. Es el dolor más
  atendido del sector, y nosotros no lo ofrecemos.
- Arreglo de pixel como producto: ninguna agencia colombiana encontrada.
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
| Generar una tienda completa con páginas legales colombianas | generador de sitio | `generar-sitio.mjs`, `legal.mjs` |
| Vendedor IA por WhatsApp en producción | workflow n8n | Zephora |
| Voz clonada para videos | ElevenLabs | «Martin Daza» |
| Plataforma para vender cursos, plantillas y membresía | **Automa** (este repositorio) | Next.js + Supabase + Stripe |

**Lectura:** ya tenemos casi todo lo que necesita una agencia completa para tiendas contraentrega.
Lo que falta no es tecnología: es empaquetarlo, ponerle precio y conseguir los primeros clientes.

---

## 2. Los dolores del cliente, ordenados por plata

| # | Dolor | Estado | Por qué duele |
|---|---|---|---|
| 1 | **Pedidos que no se entregan** (no confirman, dirección errada, rechazo en la puerta) | Supuesto: `economia.py` trabaja con 85 % confirmado y 75 % entregado, o sea ~36 % de los pedidos perdidos. **La subsesión lo está verificando.** | Se pierde la pauta de ese pedido y el flete. Es la fuga más grande del contraentrega |
| 2 | **No saben su utilidad real** después de devoluciones, flete y comisión | Supuesto | Escalan productos que pierden plata |
| 3 | **Pauta optimizando con datos rotos** (pixel) | Medido: 6 de 19 con un problema de pixel | Cada peso de pauta rinde menos |
| 4 | **Fatiga de creativos**: necesitan anuncios nuevos todo el tiempo | Supuesto (lo vivimos con nuestras tiendas) | El costo por compra sube cuando el anuncio se cansa |
| 5 | **Tienda que convierte mal** (peso, sin WhatsApp, sin reseñas, sin contraentrega visible) | Medido | Visitas pagadas que no compran |
| 6 | **Elegir producto** sin datos | Supuesto | Prueban productos saturados o sin margen |
| 7 | **Atención y postventa** que no dan abasto | Mercado (es lo que venden los bots) | Ventas perdidas por no contestar |

**Dónde está la oportunidad:** el mercado ataca casi solo el dolor 7 (bots) y el 1 a medias
(confirmación). **Nadie encontrado une el 1, el 2 y el 3**: cuánta plata entra por anuncio, cuánta
llega de verdad a la cuenta, y dónde se pierde en el camino.

---

## 3. Cómo nos ganan hoy los competidores, y qué queda libre

| Lo que hacen bien | Quién | Qué copiamos |
|---|---|---|
| Freemium para entrar («gratis hasta tu primera venta») | WASY | Entrar con algo gratis que demuestre valor: el video ya lo hace |
| Precios públicos en blogs SEO | Zeroazul, Ventiva, Ventools | Publicar precios. Da confianza y filtra |
| Páginas comparativas («X vs Y») | Ventools, Leadsales | Más adelante, cuando tengamos tráfico |
| Auditoría gratis para cerrar proyectos grandes | BoteroMedia, Limely | Ya es nuestro método, con más evidencia |
| Ecosistema de contenido y afiliados | andreybusiness y similares | Contenido propio con datos propios (ver §6) |

**Lo que nadie hace bien:**
1. Diagnóstico con evidencia por tienda, antes de vender nada.
2. Medir la utilidad real por pedido uniendo Meta, Shopify y Dropi.
3. Una sola agencia que cubra tienda, medición, creativos y operación contraentrega, especializada
   en ese modelo de negocio.

---

## 4. A dónde vamos y cómo nos mostramos

### Posicionamiento
- **Especialistas, no generalistas.** Tiendas contraentrega en Colombia que pautan en Meta.
  Un generalista cobra por hora; un especialista cobra por resultado.
- **Operadores, no teóricos.** Tenemos tiendas propias y usamos con ellas las mismas herramientas
  que vendemos. Esto se puede decir porque es cierto; **los resultados de esas tiendas no se
  publican hasta medirlos**.
- **Primero la evidencia.** Nunca vendemos sin mostrar antes, con datos de su tienda, qué está mal.
- **Rápidos porque trabajamos con IA.** Entregamos en días lo que otros entregan en semanas.

### Cómo se ve
- Dominio propio y página con precios públicos, el método explicado y un ejemplo real de hallazgo.
- Firma: «Martín, de [empresa]». **El nombre sigue pendiente.** Este repositorio ya se llama
  **Automa**: si ese es el nombre, la plataforma de cursos y la agencia comparten marca.
- Tono: directo, con números, sin promesas de «escalar a 100 millones».

---

## 5. El menú: una agencia completa

Cinco líneas, ordenadas como el cliente vive su negocio. La columna «Hoy» dice si lo podemos
entregar ya con lo que existe.

| Línea | Servicio | Dolor | Hoy |
|---|---|---|---|
| **Diagnóstico** | Video de 90 s con 2–3 hallazgos | Todos | **Sí** |
| | Diagnóstico completo + plan de arreglo | Todos | **Sí** (crawler + informe) |
| **Tienda** | Puesta a punto: peso, WhatsApp, reseñas, contraentrega visible, dominio | 5 | **Sí** |
| | Tienda nueva lista para vender, con páginas legales colombianas | 5 | **Sí** (`generar-sitio.mjs`, `legal.mjs`) |
| **Medición y rentabilidad** | Arreglo del pixel con antes y después | 3 | **Sí** |
| | Tablero de utilidad real (Meta + Shopify + Dropi) | 1, 2 | **No**: hay que construirlo. Es el producto diferenciador |
| **Creativos** | Paquete mensual de anuncios: escenas, infografías, videos con voz | 4 | **Sí** (`creativos_kie.py`, `video_pauta.py`) |
| | Investigación de producto con la biblioteca de anuncios | 6 | **Sí** |
| **Operación contraentrega** | Confirmación de pedidos por WhatsApp | 1 | **Con trabajo**: se arma con la base de n8n de Zephora |
| | Vendedor IA por WhatsApp | 7 | **Sí** (Zephora) |
| | Seguimiento de envío para bajar rechazos | 1 | **Con trabajo** |

**Fase 2, no ahora:**
- **Pauta gestionada.** Requiere tiempo humano y el resultado depende de muchas cosas. Se ofrece
  cuando tengamos casos medidos.
- **Formación en Automa.** Cursos y plantillas sobre lo mismo que hacemos, como producto de
  entrada barato para quien todavía no puede pagar una agencia.

**Regla para no dispersarnos:** el menú muestra la agencia completa, pero **se vende primero una
sola cosa** (diagnóstico → puesta a punto) y las demás se construyen en el orden en que los
clientes las pidan.

---

## 6. Entrar barato sin parecer barato

El riesgo que señala el dueño es real: si el cliente asocia «barato» con «malo», perdemos la
posición de especialista. Cómo se evita:

1. **Precio de lista público, y el descuento con nombre y razón.** «Precio fundador» para los
   primeros cinco clientes, a cambio de dejarnos publicar su caso con números. El cliente ve el
   precio completo y sabe por qué paga menos.
2. **Gratis solo lo que demuestra, nunca rebajar lo que se entrega.** El video es gratis. La
   puesta a punto no se rebaja: se le pone precio fundador por tiempo limitado.
3. **Garantía sobre lo que controlamos.** Ejemplo: «si después del arreglo tu pixel no reporta los
   eventos, te devolvemos el dinero». Nunca garantizar ventas, que no dependen de nosotros.
4. **Entregables con evidencia.** Cada trabajo termina con un informe de antes y después medido
   con el mismo crawler. Eso es lo que separa a un especialista de un barato.
5. **Nunca competir con el bot de 80.000.** No somos un bot; si el cliente solo quiere un bot,
   no es nuestro cliente.

### Escalera de precios (propuesta)
| Escalón | Qué es | Precio de lista | Precio fundador | Ancla de mercado |
|---|---|---|---|---|
| 0 | Video diagnóstico | Gratis | — | Nadie lo hace aquí |
| 1 | Diagnóstico completo + plan, **abonable** al trabajo | 250.000 | Gratis para los fundadores | — |
| 2 | Puesta a punto (tienda + pixel) | 1.800.000 | 900.000 | Auditoría 800.000–2.500.000 |
| 3 | Plan mensual de operación: monitoreo + creativos + confirmación de pedidos | Por definir | Por definir | Soporte desde 500.000; bots 390.000–850.000 |
| 4 | Vendedor IA por WhatsApp (ya cerrado) | 1.500.000 + 300.000/mes | — | Setup 420.000–5.400.000 |

El escalón 3 queda sin precio a propósito: hay que medir cuánto tiempo nos toma por cliente antes
de fijarlo. Es donde está el negocio, porque es recurrente.

---

## 7. Un paso adelante

El dueño lo dice bien: el bot de WhatsApp no es el futuro, es lo de hoy. Lo que vemos venir:

1. **El chat se vuelve gratis o casi gratis** (Meta, freemium). El valor se mueve a lo que está
   detrás del chat: la confirmación, la entrega, la utilidad real.
2. **Gana quien tenga los datos.** Tenemos 546 tiendas que pautan y un escáner que puede volver a
   pasar cada mes. Con eso podemos publicar el **«Estado de las tiendas contraentrega en
   Colombia»**: un informe con fallas agregadas y anónimas. Nadie más tiene ese dato, y es el mejor
   contenido para posicionarnos.
3. **Los creativos se vuelven volumen.** La tienda que más anuncios prueba gana. Producir creativos
   con IA a costo bajo es una ventaja que ya tenemos montada.
4. **Apuesta a vigilar, no a vender todavía:** que los asistentes de IA empiecen a recomendar y
   vender productos. Hay agencias ofreciendo «visibilidad en IA». No lo ofrecemos hasta poder
   medirlo.

---

## 8. Qué hay que verificar

| # | Qué | Por qué importa | Estado |
|---|---|---|---|
| 1 | Si es legal y seguro escribirle en frío por WhatsApp a las tiendas | **Bloquea mandar los videos** | Subsesión investigando; puede requerir abogado |
| 2 | El agente nativo de Meta en WhatsApp: precio y llegada a Colombia | Define cuánto vale el paquete 4 | Subsesión investigando |
| 3 | Cobro de Meta por mensajes de servicio desde octubre de 2026 | Sube el costo del bot y de la confirmación | Subsesión investigando |
| 4 | Tasa real de pedidos no entregados en contraentrega | Es el dolor #1 y sostiene el tablero de utilidad | Subsesión investigando; **mejor dato: el de nuestras tiendas en Dropi** |
| 5 | Precios de competidores en sus páginas completas | Para la propuesta | Falta: la red no deja abrir páginas |
| 6 | Que los clientes respondan | Todo lo demás depende de esto | **Los 4 videos son el experimento** |

## 9. Qué hay que decidir

1. **El nombre de la empresa.** ¿Es Automa?
2. **Los precios de lista y fundador** de los escalones 1 y 2.
3. **Qué construimos primero** después de la puesta a punto: el tablero de utilidad real
   (diferenciador, nadie lo tiene) o la confirmación de pedidos (lo que más se pide).

---

## 10. Cómo lo hacemos: 90 días

| Cuándo | Qué | Meta medible |
|---|---|---|
| Semana 1 | Nombre, dominio y página con precios. Verificación legal de la prospección. Mandar los 4 videos si la verificación lo permite | 4 enviados |
| Semanas 2–4 | 20 videos más, todos con la lista de comprobación. Entregar las primeras puestas a punto con antes y después | 3 clientes fundadores |
| Mes 2 | Construir el siguiente producto (tablero o confirmación) y probarlo primero en nuestras tiendas. Ofrecer el plan mensual a los fundadores | 1 cliente mensual |
| Mes 3 | Publicar el informe «Estado de las tiendas». Paquete mensual de creativos. Decidir si entra la pauta gestionada | 3 clientes mensuales |

**Métricas que importan:** tasa de respuesta al video, porcentaje que paga, días de entrega,
mejora medida por cliente (antes y después) y cuántos siguen el segundo mes.

---

## 11. Qué cubre Claude Max y qué no

- **Sí cubre** el trabajo de la agencia: auditorías, código, tiendas, guiones, análisis e informes,
  hecho por nosotros con Claude, dentro de los límites de uso del plan.
- **No cubre** lo que corre solo para el cliente las 24 horas (el vendedor IA, la confirmación de
  pedidos). Eso va por la API, y por eso el modelo ya decidido es que el cliente pague su propio
  consumo. **Confirmar en los términos de uso de Anthropic** antes de ofrecerlo.
- **Costos aparte:** imágenes (Kie), voz (ElevenLabs), n8n, dominio y Shopify del cliente.
