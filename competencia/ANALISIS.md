# Análisis de páginas de la competencia y brief de diseño

**Fecha de captura:** 21 de noviembre de 2026 · **Método:** un solo script de Playwright (`competencia/scripts/capturar.js`), solo lectura (no se enviaron formularios, no se abrieron chats ni se hizo clic en compras).
**Evidencia por sitio:** `competencia/paginas/<dominio>/` → `escritorio.png` (1440×900 @2x), `movil.png` (Pixel 7), `completa.png` (página completa @1x), `ficha.json` (datos estructurados) y `texto.txt` (texto visible de la página).

> **Cómo leer las cifras de rendimiento.** Peso y tiempos se midieron en la portada con emulación de Pixel 7, caché desactivada y **la red del contenedor, sin limitar la velocidad** (no es un 4G simulado). Sirven para comparar los sitios entre sí; en un celular real con datos móviles todos serán más lentos. "Peso" = bytes que viajaron por la red hasta el evento `load` + ~5 s. La plataforma se detecta por huellas en el HTML y es aproximada.
>
> **Regla del documento:** todo lo que se afirma de un sitio está en sus capturas o en su `texto.txt`. Las cifras de los competidores (ventas, clientes, % de mejora) se citan tal como **ellos** las publican; no las verificamos.

---

## 1. Tabla resumen

| # | Sitio (URL revisada) | Qué es | Promesa del hero (H1) | Oferta de entrada / gratis | Precios visibles | Prueba social visible | Contacto | Peso móvil | DCL móvil | Plataforma |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | zeroazul.com | Agencia IA / software | «Orquestación empresarial, el camino para convertir la IA en impacto organizacional» | «Asesoría Gratuita» | No en portada | Casos (Digital Bulk, Autolarte, Magneto 365), «+150 empresas» capacitadas, «14 países», datos de Colombia con fuente | 3 números de WhatsApp, Calendly | 1,30 MB / 56 sol. | 597 ms | Next.js + HubSpot |
| 1b | zeroazul.com/agencia-shopify | Servicio Shopify | «Agencia Shopify Partner en Colombia» | «Asesoría Gratuita», «Ver diagnósticos IA» | **Sí**, rangos en COP: auditoría $800K–$2,5M; tienda básica $3M–$8M; completa $8M–$18M; migración desde $2,5M; soporte desde $680K/mes | «15+ años en Shopify», casos (joyería de Medellín con Rolex, Cartier…), tabla «Zero Azul vs otras agencias» | WhatsApp, Calendly | 1,31 MB / 62 | 493 ms | Next.js |
| 2 | wasy.ai | SaaS vendedor IA en WhatsApp | «Tu vendedor IA que nunca duerme» | «Empieza gratis con 50 chats» | «recargas prepago desde $65.000, sin mensualidad» | Nota en La República, audios «0% actuado*» | Calendly embebido, registro | **4,81 MB** / 60 | 483 ms | No detectada |
| 3 | chateapro.com | SaaS chat (marca de Dropi) | «Dropi + Chatea PRO: El mismo ADN del Dropshipping Real.» | Prueba 14 días «SIN RIESGO», sin tarjeta | $49 / $109 / $189 / $399 al mes | «+30%», «+85%», «+$2M»; sin testimonios con nombre | «Agendar Demo» → WhatsApp (wa.link) | 2,89 MB / 44 | 1.076 ms | WordPress |
| 3b | dropi.co/chatea-pro | Landing en Dropi | «Chatea PRO» | «Unirme a la lista de espera» | No | «Multiplica tu capacidad de trabajo 4x» | Formulario de contacto de Dropi | 1,09 MB / 37 | 555 ms | Webflow |
| 4 | talkyria.com | SaaS llamadas IA para contraentrega | «Mientras lees esto, ya estoy llamando a tus clientes.» | **Demo de llamada real en el navegador** «Gratis · sin registro · máximo 3 min»; «Crear cuenta gratis» | No en portada (enlace a /precios) | «+850.000 llamadas hechas · marzo a octubre de 2026» | Demo de voz, registro | 1,22 MB / 45 | 583 ms | Next.js |
| 5 | boteromedia.com (web propia encontrada en su ficha del directorio de Shopify) | Agencia Shopify (SEO, CRO, pauta) | Titular visual «ESCALA TU TIENDA SHOPIFY CON SISTEMAS QUE CONVIERTEN» (la etiqueta H1 real es «📖 THE SCALING JOURNAL») | «Auditoría gratuita», «15 min GRATIS con un experto» | No | «+$200M USD en ventas», «+200 tiendas», casos «+150 % / +480 % ventas», ROAS «+8 / +10» | Página de contacto; popup de correo | **17,19 MB / 436** | **4.859 ms** | Shopify |
| 5b | Ficha de BoteroMedia en el directorio de Shopify | Ficha de partner | «BOTEROMEDIA» | — | No | Partner «Plus», 11–50 personas, desde 2019, mercados Colombia/EE. UU./México | Correo | 1,56 MB | 349 ms | Shopify |
| 6 | ventools.io | Servicio de recompra por WhatsApp | «No se fueron. Nadie les volvió a escribir.» | «Implementación sin costo · Prueba 15 días sin mensualidad»; **pago por cliente que regresa** | Modelo por resultado, sin cifra | Ninguna (0 testimonios, 0 logos) | Correo; botón «Ver si mi base aplica» | **0,90 MB / 30** | 664 ms | Next.js |
| 6b | ventools.io/agente-ia/ecommerce | — | **Error 404** («This page could not be found») | — | — | — | — | 0,81 MB | 490 ms | Next.js |
| 7 | ventivaia.com | Agencia de agentes IA (Cali) | «Conversaciones que venden solas.» | Demo agendada; instalación gratis en planes semestral/anual | **Sí**: $390.000 / $690.000 / $1.350.000 al mes + instalación | Cita fuentes (HBR, HubSpot); «Somos una agencia nueva…» con garantías | WhatsApp, Google Calendar | 1,03 MB / 67 | 1.694 ms | WordPress + Elementor |
| 8 | cartiadigital.com/pages/shopify-colombia | Agencia Shopify técnica | «Agencia Shopify técnica para marcas colombianas.» | «Cotización gratis en menos de 48 horas · Sin compromiso» | «Costo mensual base $39+ USD» (de Shopify, en comparativa) | **Garantía**: «PageSpeed mayor a 90 en celular, garantizado» | Formulario de 8 campos, correo | 2,01 MB / 139 | 1.031 ms | Shopify |
| 9 | lumy.casa | SaaS tienda + WhatsApp + logística | «Vende, confirma y despacha en un solo lugar.» | «7 días gratis en tu primer mes» | **Sí**: Starter desde $15 USD/mes; pago con PSE, Nequi, Botón Bancolombia | «Así le va a quien ya usa Lumy. Sin maquillar.» + descargo de resultados | WhatsApp, registro | 1,31 MB / 43 | 832 ms | SPA (Vite) |
| 10 | limely.co.uk | Agencia e-commerce (Reino Unido) | «An ecommerce agency transforming brands with conversion-driven stores» | «Free Audit» | No | 4.9 Google / 5.0 Trustpilot, Shopify Select Partner, casos con % | Chat Gorgias, formulario de cotización | 1,56 MB / 112 | **290 ms** | Next.js |
| 10b | limely.co.uk/store-audit | Landing de auditoría | «Free Store Audit + First Fix» | **Auditoría + primera corrección en vivo, gratis**; «Don't find improvements? You don't pay» | Solo filtros de facturación (£) | Casos con cifra («organic revenue +255 %»…), reseñas | Formulario de 6 campos, agenda de llamada, **auditoría de muestra en PDF** | 1,45 MB / 74 | 307 ms | Next.js |
| 11 | analyzify.com | SaaS de medición para Shopify | «Fix Your Tracking, Trust Your Data» | «Free Tracking Audit», «Switch to Analyzify, Risk-Free» | En /pricing: $145/mes o $1.305/año (Standard); $275/mes o $2.475/año (Plus); implementación $295 o gratis con plan anual | «3,000+ merchants», «300+ reviews», «4.8», casos («Purchase data fixed: 20% to 98%») | Demo, contacto de ventas | 1,81 MB / 163 | 1.183 ms | WordPress/Astro |
| 12 | lucidbot.co | SaaS chatbots | «La plataforma para construir bots que venden 24/7» | «Crea tu primer bot gratis», 7 días de prueba | No en portada | Insignia de Meta en el hero, logos de integraciones | Demo agendada, WhatsApp, chat LeadConnector | 2,11 MB / 45 | 418 ms | GoHighLevel |
| 13 | fluxi.co | SaaS embudos/landings con IA | «Todo tu marketing en un solo lugar, con IA» | «Comenzar ahora» (sin oferta gratis explícita en portada) | No (solo montos de la demo) | «+1.000 empresas», testimonios con facturación en USD («cerca de USD 84.000»…) | WhatsApp «Pregunta acá» | 1,18 MB / 35 | 553 ms | GoHighLevel + Astro |
| R1 | fuelmade.com | Referente (Shopify Plus + Klaviyo) | «We improve conversion rate, average order value, and lifetime value for ecommerce brands.» | — | — | Gráfica de conversión en el hero, casos con % | Formulario de contacto | 2,22 MB / 170 | 844 ms | Shopify |
| R2 | swankyagency.com | Referente (Shopify Plus) | «Compelling digital experiences for international brands on Shopify Plus.» | — | — | Portafolio de casos enlazados, anuncio de Shopify Diamond Partner | Contacto, chat Gorgias | **10,88 MB** / 156 | 3.367 ms | WordPress |
| R3 | eastsideco.com | Referente (Shopify Platinum) | «Shopify Platinum Partner Agency» | — | — | «We've built over 500 Shopify stores», testimonios | Formulario | **8,03 MB** / 74 | 2.481 ms | HubSpot |
| — | wemakewebsites.com | Referente elegido al inicio | **No cargó: 403 Forbidden** al navegador automatizado | — | — | — | — | — | — | — |

**Mediana del peso móvil de las 13 portadas competidoras: 1,31 MB.** Más liviana: Ventools (0,90 MB). Más pesada: BoteroMedia (17,19 MB, 436 solicitudes).

### Referentes mundiales: por qué estos tres
Elegimos agencias que el propio ecosistema de Shopify pone arriba (Plus/Platinum) y cuyo sitio es su vitrina de diseño:

- **Fuel Made** (Canadá; en su hero se presenta como «Shopify Plus Partner · Klaviyo Master Elite»). Es el que más se parece a lo que queremos ser: **el hero es una gráfica de tasa de conversión subiendo (2,5 % → 4,1 %)**. El dato es el diseño. Página corta (4.430 px), sobria, tipografía fuerte, dos CTA.
- **Swanky** (Reino Unido/Australia/Francia; en la página anuncia que será Shopify Diamond Partner en enero de 2027). Es referente de dirección de arte: serif editorial, mucho aire, portafolio de casos enlazados. Pero también es un **contraejemplo de rendimiento: 10,88 MB y DCL de 3,4 s**.
- **Eastside Co** (Reino Unido; «Shopify Platinum Partner Agency»). Es referente de prueba social a escala («We've built over 500 Shopify stores», bloque de testimonios). También pesa 8 MB por el video del hero.
- *We Make Websites* era la tercera opción original, pero respondió **403** y la reemplazamos por Eastside Co.

**Lección:** ni las agencias top del mundo hacen páginas livianas. Si la nuestra pesa menos de 300 KB, esa es una ventaja que se puede demostrar.

---

## 2. Las 4 mejores y las 3 peores

### Las 4 mejores

**1. Limely: landing «Free Store Audit + First Fix»** (`limely.co.uk__store-audit/`)
- **Oferta de entrada:** es la mejor del grupo y la más parecida a nuestro diagnóstico. No solo auditan: «walk you through the conversion leaks, and **ship the biggest fix live. Free.**» Además invierten el riesgo: «Don't find improvements? You don't pay».
- **Estructura:** H1 = oferta. Después vienen qué recibes («Audit, walkthrough, one fix live, all free»), casos, garantía, FAQ con objeciones reales («Is this genuinely free? What's the catch?», «Why are you doing this for free?», «Will you sign an NDA?») y cierra con el formulario.
- **Filtro:** pide «Monthly revenue» en un desplegable (Under £5k … £500k+) y declara para quién es («UK stores doing £10k+/month»). Así se protege el tiempo del equipo.
- **Evidencia tangible:** botón «Download A Sample Audit» (PDF). Es el único sitio que **muestra el entregable antes de pedir datos**.
- **Velocidad:** 1,45 MB, DCL de 307 ms. Es la segunda más rápida del grupo.
- Lo débil: el banner de cookies tapa parte de la primera pantalla en móvil.

**2. Talkyria** (`talkyria.com/`)
- **Copy:** el mejor del grupo. Escribe en primera persona («Soy Talkyria. Llamo en el segundo cero…») y le pone nombre al enemigo: «**Tu negocio no quiebra por el producto. Quiebra por la devolución.**» Le habla directo a la tienda contraentrega.
- **Prueba en vivo:** puedes hablar con la IA desde el navegador («Gratis · sin registro · máximo 3 min»). Es la oferta de entrada que menos fricción tiene. También tiene una calculadora: «Calcula lo que te cuestan las devoluciones».
- **Prueba social cuantificada con fecha:** «+850.000 llamadas hechas · marzo a octubre de 2026».
- **Diseño:** en la demo, cada pedido muestra su probabilidad de recibir («recibe 92 %», «recibe 38 %»). Es la única página que visualiza el **pedido entregado** como métrica. Es justo nuestro posicionamiento.
- **Velocidad:** 1,22 MB, DCL de 583 ms.
- Lo débil: mide 20.033 px. En móvil la ilustración del robot empuja el H1 por debajo de la mitad de la pantalla. No hay precios en la portada.

**3. Lumy** (`lumy.casa/`)
- **Copy:** «ves **lo que de verdad te queda**» y un ejemplo «$ 412.000 después de pauta y envíos». Habla de utilidad, no de ventas. Es lo más cercano a nuestro «tablero de utilidad real».
- **Honestidad como prueba social:** «Así le va a quien ya usa Lumy. **Sin maquillar.**» Debajo pone un descargo: «No son resultados típicos ni garantizados: dependen de tu producto, tu inversión y tu operación». Ninguna agencia colombiana hace esto.
- **Oferta y precio:** planes visibles desde $15 USD/mes, «7 días gratis en tu primer mes» y «Sin permanencia · cancelas cuando quieras». Muestra los medios de pago locales: PSE, Nequi, Botón Bancolombia.
- **Encaje local:** integra Dropi, Mastershop y 99 Envíos, y muestra el estado del pedido (confirmado → guía → entregado).
- **Velocidad:** 1,31 MB, DCL de 832 ms. Es de los pocos que tienen el Meta Pixel instalado.

**4. Analyzify** (`analyzify.com/` y `/pricing`)
- **Producto y copy:** «Fix Your Tracking, Trust Your Data». Es nuestro servicio de medición, pero como SaaS. Su mejor idea es que envían **eventos de reembolso** a GA4, Meta y TikTok «so reported revenue reflects actual collected revenue». Es el mismo concepto que nuestra «señal de entrega a Meta».
- **Prueba social sólida:** «3,000+ merchants», «300+ reviews», «4.8», y un caso concreto: «Purchase data fixed: 20% to 98%».
- **Oferta de entrada:** «Free Tracking Audit», «Switch to Analyzify, Risk-Free».
- **Precios transparentes:** por volumen de pedidos («Up to 5K … 300K»), mensual o anual, con implementación incluida en el plan anual. Es el modelo de precios más claro del grupo.
- Lo débil: 163 solicitudes y 1,8 MB por la cantidad de rastreadores (GTM, GA, TikTok, Clarity, Hotjar).

*Mención:* **Ventools** tiene la página más liviana (0,90 MB). Su oferta es la más agresiva: «Solo nos pagas por cada cliente que regresa», con implementación sin costo. También dice abiertamente para quién sirve («Funciona si tu negocio cumple esto»). Pero no muestra **ninguna** prueba social y su página `/agente-ia/ecommerce` da 404.

### Las 3 peores

**1. BoteroMedia** (`boteromedia.com/`)
- **Velocidad:** es la peor del grupo con diferencia: **17,19 MB, 436 solicitudes y DCL de 4,9 s** en móvil, aun sin limitar la red. Para una agencia que vende CRO y Shopify, eso es una contradicción visible.
- **Primera pantalla móvil:** un popup de captura de correo para Black Friday tapa el hero.
- **SEO/estructura:** el titular visual no es H1. La única etiqueta H1 es «📖 THE SCALING JOURNAL», que es el bloque del blog.
- **Prueba social:** cifras grandes sin contexto ni fuente («+$200M USD en ventas World Wide», «Aumentamos ROAS en +10»). Mezcla español e inglés («Work with us ➔», «I'M READY TO SCALE ➔»).
- A favor: ofrece «Auditoría gratuita» y «15 min GRATIS con un experto», tiene una sección «¿Esto es para ti?» y un proceso en 5 pasos.

**2. Chatea Pro** (`chateapro.com/` + `dropi.co/chatea-pro`)
- **Primera pantalla:** tanto en escritorio como en móvil muestra una **intro animada con el logo** («Saltar intro», «Desliza para continuar»). El visitante no ve la propuesta hasta que interactúa.
- **Longitud:** 22.780 px. Es la página más larga del grupo.
- **Inconsistencia:** la landing dentro de Dropi todavía pide «Unirme a la lista de espera», mientras chateapro.com ya vende planes de $49 a $399/mes.
- **Prueba social débil:** porcentajes sueltos («+30%», «+85%») sin cliente ni caso. «Agendar Demo» lleva a un enlace de WhatsApp, no a una agenda.
- A favor: precios claros, prueba de 14 días sin tarjeta y un buen tratamiento del problema de la contraentrega (huella del cliente, fletes perdidos).

**3. Zero Azul (portada)** (`zeroazul.com/`)
- **Mensaje difuso:** «Orquestación empresarial…» le habla a corporativos. La misma portada ofrece tiendas Shopify, ERP, «Vigilantte», capacitación y bots. Una tienda contraentrega no se reconoce ahí.
- **Contacto disperso:** tres números de WhatsApp distintos, Calendly y formulario, todo en la misma página.
- **Ruido:** banners de «Black Friday · 30 %» y de «Nueva plataforma Workers» compiten con el hero.
- Nota justa: su subpágina **/agencia-shopify es buena**. Publica precios en COP por servicio, tiene una comparativa «Zero Azul vs otras agencias» y una sección «Datos de Colombia, con fuente». El problema es la portada, no la empresa.

---

## 3. Patrones

### Lo que hacen casi todos
- **WhatsApp como canal de contacto** (6 de 13 portadas competidoras tienen enlace directo `wa.me`: Zero Azul, Chatea Pro, Ventiva, Lumy, LucidBot y Fluxi; Cartia lo pide como campo del formulario). El formulario largo es la excepción.
- **«Empieza gratis / Agenda una demo»** como par de CTA en el hero (Wasy, Chatea Pro, LucidBot, Talkyria, Ventiva, Lumy).
- **Hero oscuro con mockup de chat o dashboard y acentos neón o morados** (Chatea Pro, LucidBot, Ventiva, Talkyria, Cartia, BoteroMedia). Todos se parecen entre sí.
- **Porcentajes sin fuente ni caso** («+30 %», «3x», «+85 %», «ROAS +10»).
- **FAQ al final** (casi todos) y **promesas «24/7»** (todos los SaaS de chat).
- Páginas **muy largas**: 11 de 13 portadas superan los 7.500 px, y Talkyria y Chatea Pro pasan de 20.000.

### Lo que casi nadie hace (nuestra oportunidad)
- **Hablar de pedidos entregados o de utilidad real.** Solo Lumy («lo que de verdad te queda») y Talkyria («recibe 92 %») lo hacen, y ambos son SaaS, **no agencias**. Ninguna agencia lo usa como métrica.
- **Mostrar el entregable antes de pedir datos.** Solo Limely (auditoría de muestra en PDF).
- **Garantía concreta.** Solo Limely («You don't pay»), Cartia («PageSpeed > 90 en celular, garantizado») y Ventools (pago por resultado).
- **Precios de agencia publicados.** Solo Zero Azul /agencia-shopify y Ventiva.
- **Descargo honesto de resultados.** Solo Lumy.
- **Filtrar al cliente en la página** (para quién sí y para quién no). Lo hacen Limely, Ventools y BoteroMedia («¿Esto es para ti?»).
- **Medirse a sí mismos con Meta:** solo 4 de las 13 portadas competidoras cargan el Meta Pixel (Wasy, Dropi, Lumy, Ventools). Una agencia que vende medición para Meta tiene que tener su propio pixel y la API de conversiones bien puestos, y poder mostrarlo.
- **Página rápida como argumento.** Nadie lo dice, aunque Cartia lo garantiza para sus clientes.

---

## 4. Brief para nuestra página

### Posicionamiento
> **La agencia de las tiendas contraentrega que pautan en Meta. Nuestro número no es el pedido, es el pedido entregado.**

Todo el sitio responde a una idea: **el dashboard de Meta te dice cuántos pedidos hiciste; nosotros te decimos cuántos se entregaron y cuánto te quedó.** La puerta de entrada es un **diagnóstico gratis con evidencia de tu propia tienda**.

### Secciones en orden (portada única, larga solo lo necesario: objetivo ≤ 6.000 px en escritorio)

| # | Sección | Objetivo | Contenido | Inspirado en |
|---|---|---|---|---|
| 1 | **Hero** | Que la tienda contraentrega se reconozca en 3 segundos y vea la oferta | H1: «Tu pauta vende pedidos. Nosotros cuidamos que se entreguen.» Subtítulo: «Agencia para tiendas Shopify + Dropi que pautan en Meta. Medimos lo que importa: pedido entregado y utilidad real.» CTA primario: **«Quiero mi diagnóstico gratis»**. CTA secundario: «Ver un diagnóstico de ejemplo». A la derecha, un **embudo en datos reales y anonimizados**: 100 pedidos → 78 confirmados → 61 entregados → utilidad $X. Nada de mockups de chat | Fuel Made (dato como hero), Talkyria («recibe 92 %») |
| 2 | **El villano** | Nombrar el problema que la tienda siente pero no mide | «Meta te cobra por el pedido. Tú cobras por la entrega.» Tres tarjetas: devoluciones y fletes perdidos · pixel que optimiza hacia compradores que no reciben · tablero que muestra ventas y no utilidad | Talkyria («Quiebra por la devolución») |
| 3 | **Diagnóstico gratis: qué recibes** | Volver tangible la oferta de entrada | Lista concreta con capturas de **su** tienda: velocidad móvil y peso de la página de producto · eventos del pixel y la API de conversiones (qué se dispara y qué no) · checkout y formulario contraentrega · anuncios activos en la Biblioteca de anuncios · estimado de utilidad por pedido entregado. Entrega en 48 h por WhatsApp + videollamada de 20 min. Botón «Descargar diagnóstico de ejemplo (PDF)» | Limely (Audit + First Fix, sample PDF) |
| 4 | **Para quién es (y para quién no)** | Filtrar y subir la calidad del lead | Sí: Shopify + Dropi, contraentrega, pauta activa en Meta, ≥ X pedidos al mes. No: tiendas sin pauta, marketplaces, servicios | Limely, Ventools, BoteroMedia |
| 5 | **Servicios = la ruta del pedido** | Mostrar los 6 servicios como un sistema y no como una lista | Línea horizontal (en móvil, vertical): **Diagnóstico → Puesta a punto de la tienda → Medición (pixel + señal de entrega a Meta) → Tablero de utilidad real → Creativos con IA → Operación contraentrega**. Cada paso con un resultado medible y un entregable | Lumy («Así viaja un pedido»), Analyzify (eventos de reembolso) |
| 6 | **La señal de entrega** (sección estrella) | Diferenciarnos técnicamente con algo que nadie explica | Diagrama simple: Shopify → Dropi (estado de la guía) → evento «pedido entregado» por la API de conversiones → Meta optimiza hacia quien sí recibe. Una frase: «Le enseñamos a Meta a buscar compradores que reciben, no solo que piden» | Analyzify (refund events) |
| 7 | **Tablero de utilidad real** | Mostrar el producto que retiene al cliente | Captura del tablero con datos de ejemplo: ventas → entregadas → − pauta − fletes − devoluciones − producto = **utilidad**. Etiqueta visible «Datos de ejemplo» | Lumy («$412.000 después de pauta y envíos») |
| 8 | **Casos, sin maquillar** | Prueba social creíble | Al inicio puede no haber casos. **No inventar cifras.** Mostrar diagnósticos reales anonimizados (con permiso) y el antes/después de métricas verificables (peso de la página, eventos con buena calidad de coincidencia, % de entrega). Descargo al estilo Lumy. Cuando haya clientes: cliente + periodo + métrica + captura | Lumy, Limely (casos con %), Talkyria (cifra con fechas) |
| 9 | **Cómo trabajamos / precios** | Quitar el miedo al costo | Tres niveles con «desde $X COP/mes» o, como mínimo, el rango, más «sin permanencia». Si hay un componente por resultado (por pedido entregado), explicarlo aquí | Zero Azul /agencia-shopify, Ventiva, Ventools |
| 10 | **Garantía** | Invertir el riesgo | Ejemplo: «Si el diagnóstico no te muestra al menos 3 fugas concretas en tu tienda, te lo decimos y no te cobramos nada después». Elegir **una** garantía que se pueda cumplir | Limely, Cartia |
| 11 | **FAQ de objeciones reales** | Cerrar dudas | «¿Por qué gratis?», «¿Necesitan acceso a mi Shopify / Business Manager?», «¿Qué pasa con mis datos?», «¿Trabajan con Dropi?», «¿Cuánto tarda?», «¿Y si ya tengo agencia de pauta?» | Limely, Ventools |
| 12 | **Formulario de diagnóstico + WhatsApp** | Convertir | Formulario corto: URL de la tienda · WhatsApp · pedidos al mes (rango) · inversión en Meta al mes (rango) · % de entrega aproximado (opcional, «no sé» válido). Debajo: «¿Prefieres escribir? WhatsApp» (**un solo número**). Promesa: «Te respondemos en < 24 h hábiles» | Limely (filtro por facturación), Cartia («Cotización en 48 h») |
| 13 | **Pie** | Confianza básica | Razón social, NIT, ciudad, política de datos (Ley 1581), un solo WhatsApp, y el sello «Esta página pesa XX KB» | — |

### Qué copiar de cada uno
- **Limely:** oferta «auditoría + primera corrección», diagnóstico de ejemplo descargable, garantía, FAQ «¿cuál es la trampa?», filtro por facturación.
- **Talkyria:** villano con nombre (la devolución), voz directa, cifras con periodo («marzo a octubre de 2026»), calculadora de costo de devoluciones. Podemos adaptarla como «¿Cuánto te cuestan las devoluciones?» con 3 campos y cálculo en el navegador, sin JS pesado.
- **Lumy:** «lo que de verdad te queda», «sin maquillar» con descargo, medios de pago locales y «sin permanencia».
- **Analyzify:** explicación de la medición del lado del servidor y del evento que corrige el ingreso reportado; precios por tramos.
- **Fuel Made:** hero con dato, página corta, dos CTA y nada más.
- **Zero Azul /agencia-shopify:** precios en COP publicados y «datos de Colombia, con fuente».
- **Ventools:** página liviana y «funciona si tu negocio cumple esto».

### Qué evitar
- Intros animadas y popups que tapen la primera pantalla (Chatea Pro, BoteroMedia).
- Video en el hero y galerías pesadas (BoteroMedia 17 MB, Swanky 11 MB, Eastside 8 MB).
- Cifras gigantes sin fuente («+$200M», «ROAS +10»). Cada cifra debe tener cliente o periodo, o no se publica.
- Varios números de WhatsApp, o un «Agendar demo» que en realidad abre WhatsApp (Zero Azul, Chatea Pro).
- Mezclar español e inglés en CTA («Work with us ➔»).
- El look genérico de SaaS de IA: fondo negro, degradado morado, robots y mockups de chat. Lo usan 6 de 13 y no se distinguen entre sí.
- Páginas de más de 15.000 px y enlaces rotos (404 de Ventools).
- Un titular visual que no sea el H1.

### Tono
- Tuteo, español colombiano, frases cortas, verbos concretos («medimos», «conectamos», «te mostramos»).
- Habla de **plata y pedidos**, no de «transformación digital» ni de «orquestación».
- Honesto y verificable: cuando no hay dato, se dice «aún no tenemos casos publicados; mira un diagnóstico real».
- Cero emojis en titulares. Cifras siempre con unidad y periodo.

### Paleta sugerida
Base clara, que se lea al sol en el celular y se distinga del «negro + neón» de la competencia.

| Rol | Color | Uso |
|---|---|---|
| Fondo | `#F7F5F0` (papel cálido) | Fondo general |
| Superficie | `#FFFFFF` | Tarjetas, formulario |
| Tinta | `#15171A` | Texto y titulares |
| Texto secundario | `#5B616B` | Subtítulos |
| **Verde «entregado»** (marca/acción) | `#0E7A4F` | CTA, «entregado», utilidad positiva |
| Ámbar «en riesgo» | `#C46A06` | Devoluciones, fugas del diagnóstico |
| Rojo «perdido» (escaso) | `#B42318` | Solo para pérdidas en gráficas |
| Línea | `#E4E0D8` | Bordes y divisores |

Contraste: tinta sobre papel ≈ 16:1. Texto blanco sobre el verde `#0E7A4F` ≈ 5,4:1 (cumple AA). En modo oscuro se invierten la base y la tinta y se aclara el verde a `#2BB673`.

### Tipografía
- **Una sola familia variable, autoalojada y en subconjunto latino:** *Inter* o *Manrope* (titulares 700, cuerpo 400). Un archivo WOFF2 de ≤ 45 KB con `font-display: swap` y precarga.
- **Cifras:** `font-variant-numeric: tabular-nums` en tablas y en el embudo, para que los números se alineen como en un tablero.
- Alternativa de cero bytes: pila del sistema (`system-ui, -apple-system, Segoe UI, Roboto`) para el cuerpo y la fuente variable solo en titulares.
- Escala: H1 40–56 px en escritorio y 32–36 px en móvil; cuerpo de 17–18 px; líneas de 60–70 caracteres.

### Requisitos de rendimiento (no negociables)
Es lo que criticamos a las tiendas, así que nuestra página lo tiene que cumplir con margen y poder demostrarlo.

| Métrica (portada, móvil) | Presupuesto | Referencia de la competencia |
|---|---|---|
| Peso total transferido | **≤ 300 KB** (meta 200 KB) | Mediana 1,31 MB; la mejor, 0,90 MB |
| JavaScript | ≤ 50 KB comprimido (meta: casi cero en la portada) | — |
| Solicitudes | ≤ 20 | Ventools 30; BoteroMedia 436 |
| LCP en 4G simulado (Lighthouse móvil) | ≤ 1,8 s | — |
| CLS | ≤ 0,05 | — |
| INP | ≤ 200 ms | — |
| Lighthouse móvil, rendimiento | ≥ 95 | — |
| Fuentes | 1 archivo WOFF2 ≤ 45 KB | — |
| Imágenes | AVIF/WebP con `width`/`height`, `loading="lazy"` salvo el hero, hero ≤ 60 KB | — |

Implementación:
- **Página estática** (Next.js con export estático o Astro), sin hidratar la portada. Formulario HTML nativo que envía a un endpoint, y WhatsApp como enlace `wa.me` plano, **sin widget de chat**.
- **El hero se hace con HTML/SVG**, no con imagen ni video. El embudo de pedidos son barras en SVG o CSS.
- **Medición propia bien hecha:** Meta Pixel cargado después de `load` o en `requestIdleCallback`, **API de conversiones del lado del servidor** para `Lead` con deduplicación por `event_id`, y nada más que GA4 (sin Hotjar, Clarity ni GTM en la portada). Somos una agencia de medición: nuestro sitio es la vitrina.
- Banner de consentimiento ligero, sin bibliotecas de terceros, y que **no tape el hero**.
- Calculadora de devoluciones en JS puro ≤ 3 KB, cargada solo al hacer scroll hasta la sección.
- Sello en el pie generado en el build: «Esta página pesa XX KB y cargó en X s en tu celular» (con `PerformanceNavigationTiming`). Es la prueba de lo que predicamos.
- Control en CI: Lighthouse CI con presupuesto (`budget.json`) que falle el build si se pasa de 300 KB o si el LCP pasa de 1,8 s.

### Lista de verificación antes de publicar
- [ ] H1 único = la promesa; el formulario de diagnóstico es visible a 1 scroll en móvil.
- [ ] Todas las cifras tienen fuente, cliente o periodo, y las de ejemplo están marcadas como «ejemplo».
- [ ] Un solo número de WhatsApp en todo el sitio.
- [ ] Diagnóstico de ejemplo en PDF (≤ 1,5 MB, se descarga aparte, no pesa en la portada).
- [ ] Pixel + API de conversiones probados en el Administrador de eventos (calidad de coincidencia y deduplicación).
- [ ] Peso móvil ≤ 300 KB medido con el mismo script de esta carpeta (`competencia/scripts/capturar.js`), para compararnos en igualdad de condiciones.
