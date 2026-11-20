# Investigación de competencia · 20 de noviembre de 2026

Hecha por una subsesión con búsqueda web. **Limitación importante:** la red de la sesión no dejó
abrir ninguna página (WebFetch falló por DNS), así que todo sale de los extractos del buscador
sobre cada URL citada.

- **[O]** el dato aparece en el extracto de la página oficial. Bastante confiable, pero no se
  abrió la página completa.
- **[T]** el dato viene de terceros. Tratar como **no verificado**.

Conversión: USD ≈ 4.000 COP, EUR ≈ 4.600 COP.

---

## Lectura: qué cambia para la oferta

1. **El bot de WhatsApp solo ya está saturado.** Hay al menos seis proveedores colombianos con
   precio público. **WASY IA** le habla exactamente al mismo cliente («ecommerce que venden
   contraentrega en Colombia con pauta activa»), con 50 chats gratis y prepago desde 65.000 COP.
   Vendido solo, el paquete 3 compite en precio y pierde.
2. **El setup de 1.500.000 COP está en la mitad del rango** (420.000 a 5.400.000), pero la
   mensualidad de 300.000 + consumo de API se compara mal contra quienes la incluyen
   («sin cobros por tokens»). Se justifica solo si va amarrado a la tienda arreglada y la medición.
3. **Hueco más grande: la confirmación de pedidos contraentrega.** La ofrecen unos siete
   competidores de nicho y es el dolor principal del contraentrega. Encaja con n8n + Haiku casi sin
   trabajo nuevo. **Candidato a paquete propio.**
4. **El arreglo del pixel como producto cerrado no lo vende ninguna agencia colombiana
   encontrada.** Pero la CAPI nativa de Shopify es gratis y las apps cuestan USD 15–30: hay que
   venderlo en plata perdida en pauta, no en «configuración».
5. **Mensualidad fácil de agregar: monitoreo.** Correr el crawler cada mes y mandar el informe.
   Zeroazul cobra soporte desde 500.000 COP/mes.
6. **El video de auditoría personalizado es novedoso en Colombia y LatAm** (nadie encontrado),
   pero es una táctica conocida globalmente (Loom en frío) y fácil de copiar. Lo que protege es el
   crawler que encuentra problemas concretos y verificables.
7. **Precio de referencia para el paquete 1:** auditoría técnica en Colombia 800.000–2.500.000 COP
   (Zeroazul [O]).

### Lo que hay que verificar antes de decidir
- **Meta One y el agente nativo de WhatsApp** (desde USD 14,99/mes, ≈ 4–5 centavos de USD por
  mensaje, ya con invitaciones en Colombia). Si es cierto, convierte al bot básico en commodity.
  Es el dato que más pesa y viene de extractos, no de la página abierta.
- **El cobro de Meta por mensajes de servicio desde el 1 de octubre de 2026.** Cambia el costo del
  paquete 3 para el cliente.
- **Legalidad de la prospección en frío por WhatsApp** (políticas de Meta y protección de datos en
  Colombia). No se verificó; revisar antes de escalar a los 546.

---

## 1. Competidores

### A. Colombia · agentes IA por WhatsApp
| Nombre | URL | Servicios | Precios públicos | A quién le vende | Cómo consigue clientes |
|---|---|---|---|---|---|
| WASY IA | https://wasy.ai/ | Agente IA con personajes, retargeting, analítica, integración Dropi | 50 chats gratis; prepago desde 65.000 COP sin mensualidad [O]. Blog: «vamos a cobrar si vendemos» (https://wasy.ai/blog/origen) | Ecommerce contraentrega en Colombia con pauta activa [O] — **el mismo cliente** | Freemium, blog |
| Ventools | https://ventools.io/agente-ia/ecommerce | Agentes IA a medida, API oficial | 2.200.000 + 450.000/mes; 3.500.000 + 950.000; 5.400.000 + 1.400.000. Setup 48 h [O, páginas inconsistentes] | Pymes, ecommerce | SEO comparativo, demo 7–15 días |
| Ventiva.ia | https://ventivaia.com/ | Agentes en WhatsApp, IG, Messenger | 390.000/mes + 420.000 setup; 690.000 + 700.000; 1.350.000 + 1.400.000. Meta aparte [O] | Pymes | Blog SEO con precios |
| Sense IA | https://ia.sensedigital.co/ | Agente de ventas WhatsApp | 299.000/mes (500 conv.), 499.000 (2.000), 1.299.000 [O] | Pymes | No se ve |
| Trement IA | https://trement.co/ia/ | Agente WhatsApp Business | 80.000, 189.000, 649.000/mes, setup incluido, «sin cobros por tokens» [O] | Emprendedores | Prueba 48 h |
| Treggio | https://treggio.co/agente-de-whatsapp-con-ia-para-tiendas/ | Tienda + agente IA | Tienda desde 19.900/mes; IA 12.900 por 500 mensajes [O] | Tiendas pequeñas | Prueba, plan gratis |
| Fluxi | https://fluxi.co/blog/dropshipping-con-ia/ | Chatbot contraentrega con Dropi | Cotiza por WhatsApp [O] | Dropshippers Dropi | Blog |
| LucidBot | https://lucidbot.co/ | Automatización WhatsApp/IG, plantillas Dropi, confirmación de pedidos, marca blanca | Desde USD 44/mes; marca blanca USD 599 + 599/mes [O] | Ecommerce y agencias | App Shopify |
| Talkyria | https://www.andreybusiness.com/talkyria | Llamadas de voz IA para confirmar contraentrega | Por confirmación efectiva [T, fuente con conflicto de interés] | Dropshippers | Afiliados |
| Chatea Pro / Chat Center | https://www.andreybusiness.com/blog/chatcenter-vs-chatea-pro-vs-talkyria-comparativa-dropi-2026 | Bandeja multiagente para confirmar pedidos Dropi | ~USD 20–150/mes [T] | Dropshippers | Afiliados |
| Wizybot | https://apps.shopify.com/wizybot | Chatbot IA para Shopify/VTEX | Gratis; pagos desde USD 69,99/mes [O] | Marcas ecommerce | App Store |
| B2Chat | https://www.capterra.com/p/239309/B2Chat/pricing/ | Multiagente WhatsApp | ~USD 90/mes [T] | Pymes | — |
| Treble | https://treble.ai/en/platform/ | Marketing y ventas WhatsApp, agentes IA | USD 399/mes [O]; otra página «desde USD 200» [O] | Medianas y grandes | Afiliados |

### B. Colombia · Shopify, CRO, medición, todo en uno
| Nombre | URL | Servicios | Precios públicos | Nota |
|---|---|---|---|---|
| Zeroazul | https://zeroazul.com/agencia-shopify | Tiendas Shopify, **auditoría técnica**, Workers IA en WhatsApp, mantenimiento | Auditoría 800.000–2.500.000; tienda 3–8 M; Workers IA 850.000–1.200.000/mes + desde 2.500.000; soporte desde 500.000/mes [O, cifras inconsistentes] | **El que más se parece a la oferta completa** |
| Cartia Digital | https://cartiadigital.com/pages/shopify-colombia | Tienda, velocidad, apps, medición, soporte, GEO | Tienda desde USD 800; complejos 2.500–8.000 [O] | Herramientas gratis como imán |
| BoteroMedia | https://www.shopify.com/partners/directory/partner/botero-media1 | Pauta Meta/Google/TikTok, email, Shopify | Consultar | Auditoría gratis de anuncios y tienda [T] |
| JhoanRamirez Agency | https://clutch.co/profile/jhoanramirez-agency | Shopify, pauta, email | USD 25–49/hora [T] | — |
| Hulpify | https://www.shopify.com/partners/directory/partner/hulpify | Migraciones, desarrollo | Consultar | — |
| Offbeat Lab | https://www.shopify.com/partners/directory/partner/offbeat-lab | UX, SEO, páginas de producto | No publica | — |
| Carlos Enrique | https://carlosenrique.dev/products/auditoria-cro-de-shopify | Auditoría CRO Shopify | 829 (moneda no visible, parece USD) [O] | Vende la auditoría como producto |

### C. Latinoamérica
| Nombre | URL | País | Precios públicos |
|---|---|---|---|
| Leadsales | https://leadsales.io/en/pricing/ | MX | USD 97 / 133 / 247 al mes [O] |
| Botmaker | https://botmaker.com/en/prices | AR | USD 149/mes + 99 de alta [O] |
| Dialecto | https://apps.shopify.com/dialecto | UY | USD 80/mes [O] |
| Cliengo | https://guiawabusiness.cliengo.com/shopify-whatsapp | AR | No visto |
| Chat Nube (Tiendanube) | https://ayuda.tiendanube.com/es_CO/activar-chat-nube/que-es-chat-nube | AR/BR | Por conversación, moneda no visible [O] |

### D. SaaS globales (la alternativa barata)
| Nombre | URL | Precios públicos |
|---|---|---|
| Wati | https://www.wati.io/ | USD 59–279/mes anual; 69–349 mensual [O/T] |
| Kommo | https://www.kommo.com/buy/tariff/ | USD 25–45 por usuario/mes [O] |
| Callbell | https://www.callbell.eu/en/pricing/ | €14–18 por agente + WhatsApp desde €20 [O] |
| Zipchat | https://zipchat.ai/pricing | Desde USD 49/mes [O] |
| Meta One / agente nativo | https://about.fb.com/news/2026/09/introducing-meta-one-subscription-service-more-features-ai/ | Desde USD 14,99/mes; ≈ 4–5 centavos de USD por mensaje [O, **verificar**] |

### E. Referentes globales
| Nombre | URL | Por qué sirve |
|---|---|---|
| Analyzify | https://analyzify.com/pricing | Medición como producto cerrado: USD 2.790 único o 145/mes [O] |
| Elevar | https://getelevar.com/pricing-and-plans/ | Medición como suscripción, desde USD 200/mes [O, posiblemente desactualizado] |
| Limely | https://www.limely.co.uk/store-audit | **Lo más parecido al método:** auditoría gratis + video Loom + un arreglo en vivo [O] |
| Stape | https://stape.io/es/gateways | Herramienta para ofrecer CAPI sin personal [O] |

---

## 2. Servicios que ellos ofrecen y nosotros no

| Servicio | Cuántos | ¿Se entrega con IA? |
|---|---|---|
| Confirmación de pedidos contraentrega | ~7 | **Sí. Prioridad.** |
| Recuperación de carritos por WhatsApp | ~4 | Sí |
| Notificaciones de envío por WhatsApp | ~4 | Sí |
| Retargeting y difusiones | ~5 | Sí |
| CRM / bandeja multiagente | ~8 | Mejor integrar que construir |
| Mantenimiento mensual de la tienda | ~3 | **Sí: el crawler como monitoreo** |
| Tracking más allá del pixel de Meta | ~4 | Parcial (Stape, apps) |
| Pauta / media buying | ~4 | No, requiere personas |
| Diseño y migración de tiendas | ~6 | Parcial |
| Email y SMS | ~3 | Sí |
| Agente de voz | 2 | Sí, más complejo |

## 3. Rangos de precio (COP)

- **Agente IA gestionado:** setup 420.000–5.400.000 (típico 700.000–2.500.000); mensualidad
  299.000–1.400.000 (entrada típica 390.000–850.000).
- **SaaS de WhatsApp con IA:** desde 19.900 hasta ~1.600.000/mes; la gama media-baja ronda
  150.000–280.000.
- **Auditoría técnica:** 800.000–2.500.000 en Colombia; freelancers 200.000–4 M; agencias
  globales 6–20 M.
- **Arreglo de pixel / CAPI:** freelancers 400.000–1.600.000; Analyzify ≈ 11 M; apps
  60.000–280.000/mes. La integración nativa de Shopify con Meta es gratis.

## 4. Riesgos

1. Meta entrando directo con su agente nativo (verificar).
2. Guerra de precios hacia abajo y pruebas gratis por todas partes.
3. Cobro de Meta por mensajes de servicio desde octubre de 2026 (verificar).
4. Mercado ruidoso: muchas cifras vienen de fuentes con conflicto de interés.
5. Prospección en frío por WhatsApp: riesgo de políticas y protección de datos (verificar).

## Fallos de red

WebFetch no pudo abrir leadsales.io, www.callbell.eu, www.kommo.com ni www.wati.io (dominios no
permitidos en la red de la sesión). Sin precio público encontrado: Treble en firme, Cliengo,
Fluxi, Talkyria, Chatea Pro, Chat Center, BoteroMedia, Hulpify. No se encontraron agencias de
medición con sede en Colombia y precio público.
