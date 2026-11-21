# Estudio de nombre para la agencia · 21 de noviembre de 2026

Estudio para escoger el nombre de la agencia de tiendas contraentrega (Shopify + Dropi + Meta) y de
la plataforma de cursos. Se apoya en `docs/estrategia-agencia.md`: «nuestro número no es el pedido,
es el pedido entregado», precios económicos gracias a la IA, pero sin sonar barato ni a bot.

Todas las verificaciones se hicieron el **21 de noviembre de 2026** desde este entorno. Cada dato
dice de dónde sale. Lo que no se pudo consultar se dice, sin inventar resultados.

---

## 0. Conclusión en corto

1. **Automa no es viable como marca pública.** Ya hay un «AUTOMA» que vende exactamente un bot de
   IA por WhatsApp para negocios en español (`somosautoma.com`), una empresa colombiana con
   `automa.com.co` (audio y video, más de 20 años), la marca AUTOMA **registrada en México en las
   clases 35, 41 y 42** (agosto de 2026), solicitudes en Chile y Brasil, y una plataforma de
   automatización con IA y una extensión de Chrome de ~200.000 usuarios con el mismo nombre. Además
   «autómata» suena a bot, que es justo lo que no queremos. Detalle en el §6.
2. **Terna final (en orden):** **Firme**, **Rendo**, **Llega**, **Tino**, **Velta**.
3. **Recomendación: Firme.** Es la que mejor cuenta la promesa («pedido en firme»), es una palabra
   que todo colombiano escribe bien al primer intento, `firme.co` y `firme.com.co` aparecen libres,
   y no encontramos empresa colombiana ni marca latinoamericana de marketing con ese nombre.
   Su riesgo principal: dos solicitudes «FIRME» en México en la clase 42 y una en EE. UU.
4. **Ningún nombre corto tiene el `.com` libre.** Los 20 `.com` exactos están tomados, y también
   todos los inventados que probamos. La salida realista es `.co` como dominio principal más un `.com`
   con modificador (por ejemplo `somosfirme.com`, que aparece libre).

---

## 1. Método y límites

| Verificación | Cómo se hizo | Límite |
|---|---|---|
| `.com` | RDAP de Verisign (`https://rdap.verisign.com/com/v1/domain/<nombre>.com`): 200 = registrado, 404 = libre. Segunda fuente: DNS público de Google (`https://dns.google/resolve?name=<dominio>&type=NS`) | — |
| `.co` y `.com.co` | **El RDAP no sirve para `.co`**: `rdap.org` responde «No RDAP service is available» y `rdap.registry.co` devuelve 404 incluso para `google.co`. Por eso se usó la delegación DNS en la zona `.co` (NXDOMAIN = no existe en la zona; servidores de nombres = registrado), confirmada con el WHOIS web de `https://www.whois.com/whois/<dominio>` | El WHOIS web está limitado por cuota y dio «sin registro» para dominios que sí tienen servidores de nombres. **Se toma como registrado todo dominio con servidores de nombres.** Un dominio sin servidores de nombres puede seguir registrado (raro); confirmar en el registrador antes de comprar |
| Sitio activo | Navegador sin cabeza (Playwright) y `urllib`, título y texto de la portada | Algunos sitios no respondieron desde el proxy (error de túnel o de TLS); se marca «sin respuesta» |
| Empresas | Buscador web (WebSearch) con consultas por nombre + Colombia/LatAm + sector, más lo que mostraron los dominios tomados | Bing y DuckDuckGo bloquean las consultas automáticas. **El RUES no cargó** (`https://www.rues.org.co/` queda en blanco), así que no se revisaron razones sociales en las cámaras de comercio |
| Marca en Colombia (SIC) | `https://sipi.sic.gov.co/` | **Bloqueado.** El cortafuegos de la SIC responde «Web Page Blocked! … Attack ID: 20000051» tanto en la portada como en `/sipi/Extra/IP/Mutual/Browse.aspx`. **No hay resultado de la SIC en este estudio** |
| Marca en LatAm (OMPI) | Global Brand Database, búsqueda «Nombre de la marca contiene la palabra …», `https://branddb.wipo.int/es/similarname`. Se leyeron hasta 300 registros por nombre, ordenados por pertinencia, y se filtraron los vigentes (registrados o en trámite) en las clases 35, 41 y 42 | **La OMPI no incluye el registro nacional de la SIC.** Lo comprobamos con «bancolombia»: solo aparecen sus registros de Perú, EE. UU., la UE, el Reino Unido, Costa Rica y Trinidad y Tobago. Sí cubre México, Brasil, Chile, Perú, Uruguay, Paraguay y otros. En nombres con más de 300 coincidencias pudo quedar algo sin leer |
| TikTok | Página pública `https://www.tiktok.com/@<usuario>`: `statusCode` 0 = existe, 10221 = no existe, 10222 = existe pero es privada o restringida | Se revisó `@nombre` y `@nombreco` |
| Instagram | `https://www.instagram.com/<usuario>/` | **Sin comprobar**: sin sesión, Instagram redirige siempre a la página de inicio de sesión, exista o no la cuenta |

---

## 2. Los 20 candidatos

Leyenda de dominios: **L** = libre (NXDOMAIN), **T** = tomado. OMPI = registros vigentes con el
nombre exacto en las clases 35, 41 o 42; entre paréntesis, cuántos son de LatAm.

| # | Nombre | Estilo | Por qué está en la lista | .com | .co | .com.co | OMPI 35/41/42 | TikTok @nombre / @nombreco | Instagram | Veredicto |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Automa** | Inventado | Nombre de trabajo; corto, sugiere automatización | T (en venta) | T | T (empresa activa) | 10 (5) | T / L | Sin comprobar | **Descartado** (§6) |
| 2 | **Tino** | Español | «Tener buen tino»: precisión y criterio | T | T (en venta) | L | 25 (11) | T / T | Sin comprobar | **Terna (4.º)** |
| 3 | **Neto** | Español | Utilidad neta: lo que de verdad queda | T | T (estacionado) | L | 7 (4) | T / T | Sin comprobar | Descartado |
| 4 | **Firme** | Español | «Pedido en firme»; en Colombia, «firme» es sólido y confiable | T (en venta) | **L** | **L** | 6 (2) | T / L | Sin comprobar | **Terna (1.º)** |
| 5 | **Llega** | Español | El pedido llega: la promesa en una palabra | T | T | L | 1 (1) | T / L | Sin comprobar | **Terna (3.º)** |
| 6 | **Rinde** | Español | La plata rinde | T | T (en venta) | T (app activa) | 2 (0) | T / L | Sin comprobar | Descartado |
| 7 | **Cuadra** | Español colombiano | «Cuadrar las cuentas» | T | T | T | 10 (2) | T / T | Sin comprobar | Descartado |
| 8 | **Margen** | Español | Utilidad por pedido | T (agencia activa) | L | L | 7 (3) | T / existe | Sin comprobar | Descartado |
| 9 | **Saldo** | Español | Saldo a favor después de devoluciones | T | T (en venta) | T | 2 (0) | T / L | Sin comprobar | Descartado |
| 10 | **Puntual** | Español | Entrega a tiempo | T (agencia activa) | T | T (empresa activa) | 0 (0) | T / L | Sin comprobar | Descartado |
| 11 | **Trazo** | Español | Precisión, trazabilidad | T | T (empresa activa) | T | 8 (8) | existe / T | Sin comprobar | Descartado |
| 12 | **Pulso** | Español | Medición constante | T | T | T (app activa) | 25 (20) | T / T | Sin comprobar | Descartado |
| 13 | **Recaudo** | Español colombiano | El dinero que efectivamente se cobra en contraentrega | T (en venta) | T | T | 0 (0) | T / L | Sin comprobar | Descartado |
| 14 | **Faro** | Español | La señal que guía la campaña | T (empresa global) | T (sitio activo) | T | 19 (4) | T / T | Sin comprobar | Descartado |
| 15 | **Certa** | Inventado (de «certero») | Precisión | T (en venta) | T | T (empresa activa) | 25 (5) | L / T | Sin comprobar | Descartado |
| 16 | **Velta** | Inventado | Neutro, sobrio, internacional | T (marca de Uponor) | T | L | 10 (4) | T / L | Sin comprobar | **Terna (5.º)** |
| 17 | **Ventra** | Inventado (venta + entrega) | Venta que se entrega | T | T (en venta) | L | 13 (2) | existe / T | Sin comprobar | Descartado |
| 18 | **Rendo** | Inventado (de «rendir», «rendimiento») | Que la pauta rinda | T | **L** | **L** | 5 (0) | T / L | Sin comprobar | **Terna (2.º)** |
| 19 | **Landed** | Inglés | «Pedido aterrizado»; en Colombia «aterrizar» es volver a lo real | T | T | L | 5 (0) | T / T | Sin comprobar | Descartado |
| 20 | **Proof** | Inglés | «Primero la evidencia» | T (empresa activa) | T | L | 46 (1) | T / T | Sin comprobar | Descartado |

> Nota: en la columna OMPI, «0» significa que entre los registros leídos no hubo marca vigente con
> el nombre exacto en 35/41/42; no es una garantía de que no exista (y no cubre la SIC).

---

## 3. Evidencia por candidato

Para no repetir, las URL de cada verificación siguen este patrón (reemplazando el nombre):

- `.com`: `https://rdap.verisign.com/com/v1/domain/<nombre>.com`
- `.co` y `.com.co`: `https://dns.google/resolve?name=<dominio>&type=NS` y `https://www.whois.com/whois/<dominio>`
- OMPI: `https://branddb.wipo.int/es/similarname` → «contiene la palabra <nombre>»
- TikTok: `https://www.tiktok.com/@<usuario>`
- Instagram: `https://www.instagram.com/<usuario>/` (siempre redirige al inicio de sesión)

### 1. Automa
- **Dominios:** `automa.com` registrado desde 2004 y **en venta** (redirige a `brandolo.com/name/Automa.com`). `automa.co` delegado (sin respuesta desde el proxy). `automa.com.co` **activo**: «Automa – Soluciones Tecnológicas», distribuidor mayorista de audio y video profesional (Bose, Unilumin, Samsung) en Bogotá y Medellín, «más de 20 años», Instagram `automa_colombia`.
- **Empresas:** `somosautoma.com`: «AUTOMA | Automatizaciones para todos». Vende un asistente («Iktan») que **responde por WhatsApp, agenda y recuerda citas** a negocios, en español. Es exactamente la categoría de la que la agencia se quiere alejar y con el mismo nombre. `automa.site` → `goautoma.com`: «Automa: No-Code AI Automation & Agentic AI Platform», agentes de IA y RPA. Extensión de Chrome «Automa» (automatización del navegador) con **~200.000 usuarios** (`https://chromewebstore.google.com/detail/automa/infppggnoaenmfagbfknfkancpbljcca`).
- **OMPI (107 resultados):** **AUTOMA, LAYER7 S.A.P.I. de C.V., México, clases 35, 37, 41 y 42, registrada el 20 de agosto de 2026 (n.º 3096072)** y otra en la 35 (n.º 3096073). AUTOMA en trámite en México, clase 42 (n.º 0119853579181). Automa Electrónica Ltda., Chile, clases 35 y 42, en trámite. AUTOMA Engenharia e Software, Brasil, 35 y 42, registradas (2024). Fuera de LatAm: Italia (registro internacional, 42), Reino Unido (42), Albania (35, 42).
- **TikTok:** `@automa` existe (creador de logos, francés, 2 seguidores). `@automaco` libre.

### 2. Tino
- **Dominios:** `tino.com` registrado desde 1997. `tino.co` registrado en 2020 (Namecheap) y **en venta** en GoDaddy. `tino.com.co` libre. `tino.app` y `tino.lat` delegados.
- **Empresas:** sin empresa «Tino» en marketing, e-commerce o software en Colombia o México según el buscador. Lo más cercano: Tienwi (agencia Shopify en Floridablanca), otro nombre.
- **OMPI (1.080 resultados, 284 leídos):** TINO, Omnimedia Live, México, clase 35, registrada (2008), y TINO, Dreidel Interactive, México, 35, registrada (2018). Tino, Tino Intermediação de Serviços, Brasil, 35, registrada (2020). TINO, Brasil, 41 y 42, registradas (2022). TINO en trámite en México, 41.
- **TikTok:** `@tino` (474 seguidores) y `@tinoco` existen.

### 3. Neto
- **Dominios:** `neto.com` (1996), `neto.co` estacionado (CashParking), `neto.com.co` libre.
- **Empresas y marca:** **Tiendas Neto** (Tiendas Super Precio, México) tiene NETO registrada en la clase 35 (2009, 2010 y septiembre de 2026). Neto en Brasil, 41. Neto E-Commerce Solutions (Australia, 42) es además una plataforma de comercio electrónico. Es la cadena de descuento: justo la asociación con «barato» que queremos evitar.
- **TikTok:** `@neto` y `@netoco` existen.

### 4. Firme
- **Dominios:** `firme.com` registrado desde 2000, **en venta** (Afternic/GoDaddy). **`firme.co` libre** y **`firme.com.co` libre** (NXDOMAIN y sin registro en WHOIS). `somosfirme.com` y `firmeagencia.com` libres; `enfirme.com`, `getfirme.com` y `firmehq.com` tomados. `firme.lat` y `firme.la` libres.
- **Empresas:** el buscador no mostró ninguna agencia, app ni plataforma llamada «Firme» en Colombia (ni en Bogotá, Medellín o Cali). Asociación conocida: **Grupo Firme**, banda mexicana de música regional.
- **OMPI (726 resultados, 194 leídos):** **FIRME, México, clase 42, dos solicitudes en trámite** de personas naturales (n.º 0119853172295, de junio de 2024, y n.º 0119853734540, de octubre de 2026). FIRME, Clarity Code Corp, EE. UU., clases 9, 35, 42 y 45, en trámite (julio de 2026). Fuera de eso, solo marcas compuestas («Grupo Firme» en 41 en México, «La Firme» en 35 en Perú, «Terra Firme», «Mano Firme», etc.).
- **TikTok:** `@firme` existe (cuenta personal, 1 seguidor). `@firmeco` libre.

### 5. Llega
- **Dominios:** `llega.com` (1999), `llega.co` delegado (un proyecto en Vercel en pausa: «Deployment Paused»). `llega.com.co` libre. `llegaagencia.com` libre.
- **Empresas:** sin startup «Llega» en Colombia o LatAm; en el buscador la palabra aparece como verbo («99minutos llega a Colombia»).
- **OMPI (417 resultados, 295 leídos):** una sola marca idéntica vigente en nuestras clases: **LLEGA, México, clase 35, en trámite** (persona natural, n.º 0119853303123, enero de 2025). El resto son eslóganes que contienen la palabra («Llega más lejos», «En un zumbido llega tu pedido», «Relájese, su envío seguro llega»), casi todos en la 35 en México.
- **TikTok:** `@llega` existe (cuenta personal). `@llegaco` libre.

### 6. Rinde
- **Dominios:** `rinde.com` (1998). `rinde.co` registrado en febrero de 2026 y en venta (GoDaddy). **`rinde.com.co` activo: «Rinde · Planes en Cartagena que caben en tu presupuesto»**, app colombiana de consumo.
- **OMPI:** RINDE+ (RindeMas SL, España, 35). Sin LatAm idénticas en 35/41/42.
- **Por qué se descarta:** ya existe una marca colombiana activa con el `.com.co`, y su posicionamiento es «planes baratos».

### 7. Cuadra
- **Dominios:** `cuadra.com` (1992, sistema de soporte STARFISH), `cuadra.co` y `cuadra.com.co` delegados.
- **OMPI:** CUADRA, Manufacturera de Botas Cuadra (marca mexicana de botas), registrada en la clase 35 en Chile, EE. UU., la UE, Australia, Japón y Nueva Zelanda; CUADRA, Activos Inc, México, 35. Decenas de compuestas en México.
- **Por qué se descarta:** marca de botas consolidada en la clase 35 y confusión con «cuadra» (manzana).

### 8. Margen
- **Dominios:** `margen.com` **activo**: «margen – Comunicación corporativa multimedia» (mismo sector). `margen.co` y `margen.com.co` libres. **`margen.lat` activo: «Margen — Análisis de gestión para empresas, asesores y estudios»**, un SaaS que convierte ventas, costos y caja en análisis de rentabilidad (con un asistente «Margo»).
- **OMPI:** MARGEN, México, 35, en trámite; MARGEN, Uruguay, 35 y 42, registrada (2022); MARGEN 360°, Perú, 35.
- **Por qué se descarta:** un producto de LatAm ya vende «Margen» para lo mismo que será nuestro tablero de utilidad real, y además el nombre es casi descriptivo, débil para registrar.

### 9. Saldo
- **Dominios:** `saldo.com` (Saldo Bank), `saldo.co` estacionado y en venta (NamePros), `saldo.com.co` delegado.
- **OMPI:** SALDO, Konsumenteninfo AG, Suiza, clases 9, 35, 38 y 41, registrada. Ninguna idéntica en LatAm (239 resultados, 230 leídos).
- **TikTok:** `@saldo` con 77.200 seguidores.
- **Por qué se descarta:** en Colombia «saldos» es mercancía de remate. Suena a barato, que es justo el criterio que no puede fallar.

### 10. Puntual
- **Dominios:** `puntual.com` **activo: «Puntual comunicación y marketing», agencia de publicidad en Alicante**. **`puntual.com.co` activo: «Grupo Puntual Comunicaciones»** (Colombia). `puntual.co` delegado.
- **Por qué se descarta:** dos agencias de comunicación con el mismo nombre, una de ellas colombiana.

### 11. Trazo
- **Dominios:** **`trazo.co` activo: «Trazo | Seguimiento, control y gestión de tu recaudo — Concilia en minutos, reduce fraude y automatiza tu recaudo»**. `trazo.com` en venta, `trazo.com.co` estacionado en GoDaddy.
- **OMPI:** TRAZO, Dakab México, 35 y 41, registradas; TRAZO, México, 35 (2002) y otra en trámite.
- **Por qué se descarta:** conflicto directo. Es un SaaS de conciliación de recaudo, vecino de nuestro tablero de utilidad.

### 12. Pulso
- **Dominios:** `pulso.co` (desde 2010) y **`pulso.com.co` activo: «Pulso — Sabe al instante cuándo te pagan»** (app colombiana de avisos de pago).
- **OMPI:** 25 marcas idénticas vigentes en 35/41/42, 20 de ellas en LatAm (México, Paraguay, etc.).
- **Por qué se descarta:** saturado y con una app colombiana del sector pagos.

### 13. Recaudo
- **Dominios:** `recaudo.com` en venta (GoDaddy), `recaudo.co` y `recaudo.com.co` delegados.
- **OMPI:** sin marcas idénticas en 35/41/42 (6 resultados en total).
- **Por qué se descarta:** es un término genérico de la contraentrega y de los bancos (difícil de registrar solo y de posicionar en buscadores), y suena a cobranza.

### 14. Faro
- **Dominios:** `faro.com` = **FARO Technologies** (medición 3D, registro internacional en 9 y 42). `faro.co` activo («FARO - Home»), `faro.com.co` delegado.
- **OMPI:** FARO en Brasil, 35 y 42 (en trámite y registradas); Faro App S.L., España, 35; WIZAERO, Francia, 35, 38, 41 y 42.
- **Por qué se descarta:** marca global fuerte en la 42 y muchos titulares.

### 15. Certa
- **Dominios:** `certa.com` en venta como dominio premium. **`certa.com.co` activo: «CERTA — El azar, verificable. Operador tecnológico de rifas legales en Colombia»**. `certa.co` delegado.
- **OMPI:** 25 idénticas vigentes en 35/41/42 (1.841 resultados, 296 leídos). En LatAm: CERTA, Certa AG, México, 42 (1994); CERTA, Brasil, 35 y 42; CERTA, Uruguay, 35 y 36 (2025); y CERTA PUBLICIDAD, Chile, 35 (2014).
- **Por qué se descarta:** empresa tecnológica colombiana con el mismo nombre y su `.com.co`.

### 16. Velta
- **Dominios:** `velta.com` redirige a **Uponor** (Velta es su marca de calefacción por piso). `velta.co` delegado (un WordPress caído en `landing.velta.co`). `velta.com.co` libre.
- **Empresas:** el buscador no mostró ninguna «Velta» de marketing o tecnología en Colombia.
- **OMPI (120 resultados):** **VELTA, México, 35, registrada (mayo de 2021)** y otra en trámite (2024). VELTA, Studio Gaya Academia, Brasil, **41**, registradas (2026). Fuera de LatAm: 6 más, entre ellas VELTA de VKR Holding (grupo Velux) en la UE y el Reino Unido, clases 41 y 42.
- **TikTok:** `@velta` existe (22 seguidores). `@veltaco` libre.

### 17. Ventra
- **Dominios:** `ventra.com` tomado; `ventra.co` en venta (GoDaddy); `ventra.com.co` libre.
- **OMPI:** Ventra, Brasil, 35 y 41, registradas en mayo de 2026; 13 idénticas vigentes en total. Ventra también es la tarjeta de transporte de Chicago.
- **Por qué se descarta:** marca reciente en Brasil en las dos clases que nos importan, y la confusión V/B al dictarlo.

### 18. Rendo
- **Dominios:** `rendo.com` registrado (2001, Japón). **`rendo.co` libre** y **`rendo.com.co` libre**. `somosrendo.com` y `rendoagencia.com` libres. `rendo.app` estacionado en Porkbun («Coming Soon»); `rendo.lat` delegado; `rendo.la` libre.
- **Empresas:** el buscador no mostró ninguna empresa «Rendo» de software, marketing o e-commerce en Colombia ni en México (lo más cercano: Dondo y Venndelo, otros nombres).
- **OMPI (36 resultados, todos leídos):** en LatAm, RENDO en México en las clases **36 (registrada) y 25 (en trámite)**, y en Perú en la 30. **Ninguna en 35, 41 o 42 en LatAm.** Fuera: RENDO, UE, 31 y 35 (camarones); Rendo LLC, EE. UU., 9 y 42, en trámite; Hera Medical, España, 42; Indonesia, 35 en trámite. En Brasil hay marcas «Eu me rendo» (41).
- **TikTok:** `@rendo` existe (24 seguidores). `@rendoco` libre.

### 19. Landed
- **Dominios:** `landed.com` (programa de vivienda en EE. UU.), `landed.co` (alquiler de casas en Reino Unido), `landed.com.co` libre.
- **OMPI:** 5 idénticas vigentes en 35/41/42 (EE. UU., Canadá y España); ninguna en LatAm.
- **Por qué se descarta:** al dictarlo hay que deletrearlo, y cada quien lo pronuncia distinto («lánded», «léndid»).

### 20. Proof
- **Dominios:** `proof.com` activo («Proof | Identity-centric security platform»), `proof.co` registrado desde 2010.
- **OMPI:** 46 idénticas vigentes en 35/41/42 (una en México, clase 41).
- **Por qué se descarta:** saturado en el mundo y difícil de dictar.

---

## 4. Por qué cayeron los descartados

| Motivo | Nombres |
|---|---|
| Empresa activa con el mismo nombre en Colombia o en el mismo oficio | Automa, Rinde, Puntual, Trazo, Pulso, Certa, Margen |
| Marca registrada en LatAm en nuestras clases, con titular fuerte | Automa, Neto, Cuadra, Faro, Pulso |
| Suena a barato o a remate | Neto (Tiendas Neto), Saldo |
| Genérico, difícil de registrar o de encontrar | Recaudo, Margen |
| Difícil de dictar | Landed, Proof, Ventra (V/B) |

---

## 5. Terna final (en orden)

Criterios ponderados: disponibilidad de dominio `.co`/`.com.co` · ausencia de conflicto en Colombia
y en las clases 35/41/42 de LatAm · que cuente la promesa · que se dicte sin deletrear · que no suene
a barato ni a bot · que sirva para la agencia y para los cursos.

### 1.º Firme
- **Pros:** cuenta la promesa sin explicarla: un pedido **en firme** es el que sí se concreta. En
  Colombia «firme» se usa para algo sólido y confiable («eso está firme»). Dos sílabas, se escribe
  como suena y nadie lo confunde por teléfono. No suena a bot ni a IA, así que no envejece si cambia
  el producto. Funciona en las dos marcas: «Firme» (agencia) y «Firme Academia» o «Escuela Firme»
  (cursos). **`firme.co` y `firme.com.co` aparecen libres**; también `somosfirme.com`.
- **Contras:** es una palabra común, así que no tendremos el SEO de la palabra sola y `firme.com`
  cuesta plata (está en venta). La asociación con Grupo Firme (banda mexicana) puede salir en
  búsquedas.
- **Riesgos:** dos solicitudes «FIRME» en México en la clase 42 (de 2024 y octubre de 2026) y una en
  EE. UU. (9, 35, 42, 45). En Colombia no se pudo revisar la SIC. La SIC podría considerarla poco
  distintiva para servicios de «confirmación de pedidos»; registrarla con logotipo (marca mixta)
  reduce ese riesgo.

### 2.º Rendo
- **Pros:** el registro más limpio de la lista: **sin marcas en 35, 41 o 42 en LatAm**, sin empresa
  conocida, `rendo.co`, `rendo.com.co`, `somosrendo.com` y `@rendoco` libres. Remite a «rendir» y a
  «rendimiento» (que la pauta rinda), sin decir «barato». Dos sílabas y se dicta sin problema.
- **Contras:** no es palabra del español («yo rindo»), así que alguien puede leerlo como error. En
  portugués «eu me rendo» es «me rindo», y en español puede evocar «rendirse». Hay que explicarlo
  una vez («Rendo, de rendimiento»).
- **Riesgos:** RENDO en México en la clase 36 (servicios financieros) y en trámite en la 25. Rendo LLC
  en EE. UU. en la 42, en trámite. Sin dato de la SIC.

### 3.º Llega
- **Pros:** es la promesa literal: el pedido **llega**. Fácil de recordar y de usar en mensajes
  («Con Llega, el pedido llega»). No suena a bot. `llega.com.co`, `llegaagencia.com` y `@llegaco`
  libres. En la OMPI solo aparece una solicitud idéntica en LatAm.
- **Contras:** al ser un verbo cotidiano casi no se puede posicionar en buscadores ni defender como
  marca sin logotipo. `llega.co` está tomado (un proyecto en pausa en Vercel). Se asocia más a
  mensajería o domicilios que a una agencia, y al dictarlo puede haber duda entre «ll» e «y».
- **Riesgos:** LLEGA, México, clase 35, en trámite (enero de 2025). La SIC podría negarlo por descriptivo en servicios ligados a la entrega. Marcas compuestas en México («Llega más lejos», «En un zumbido llega tu pedido») en la 35.

### 4.º Tino
- **Pros:** «buen tino» es precisión y criterio, muy colombiano. Dos sílabas, cálido, dictado limpio.
  `tino.com.co`, `tinoagencia.com` y `somostino.com` libres.
- **Contras:** suena a apodo (Tino de Faustino o Constantino), menos serio para una agencia que
  cobra por resultados. `tino.co` está en venta (precio desconocido).
- **Riesgos:** TINO registrada en la clase 35 en México (Omnimedia, 2008) y en Brasil (Tino
  Intermediação de Serviços, 2020), además de 41 y 42 en Brasil. Es el más expuesto de la terna fuera
  de Colombia.

### 5.º Velta
- **Pros:** inventado, sobrio, con sonido de marca internacional, sin connotación de barato ni de bot.
  Sirve para crecer a otros países y a otros productos. `velta.com.co` y `@veltaco` libres.
- **Contras:** no cuenta nada de la promesa (hay que llenarlo de significado con la comunicación). Al
  dictarlo hay que aclarar «con V», por la confusión entre V y B. `velta.com` es una marca de Uponor y
  `velta.co` tiene dueño.
- **Riesgos:** VELTA registrada en la clase 35 en México (2021) y otra solicitud en trámite; VELTA en la
  41 en Brasil (2026), que pega con la plataforma de cursos si algún día se vende allá.

### Resumen de la terna
| | Firme | Rendo | Llega | Tino | Velta |
|---|---|---|---|---|---|
| Cuenta la promesa | Alta | Media | Alta | Media | Baja |
| Dictado | Limpio | Limpio | Duda ll/y | Limpio | Aclarar V |
| `.co` / `.com.co` | L / L | L / L | T / L | T (en venta) / L | T / L |
| `.com` con modificador | somosfirme.com L | somosrendo.com L | llegaagencia.com L | somostino.com L | — |
| Conflicto OMPI LatAm 35/41/42 | 2 solicitudes en la 42 (MX) | Ninguno | 1 solicitud en la 35 (MX) | 35 (MX, BR) | 35 (MX), 41 (BR) |
| Empresa colombiana con el nombre | No encontrada | No encontrada | No encontrada | No encontrada | No encontrada |
| Suena barato o a bot | No | No | No | No | No |

---

## 6. Automa, sin rodeos

**No es viable como nombre público de la agencia ni de la plataforma.** Razones, de mayor a menor peso:

1. **Ya hay un AUTOMA vendiendo bots de WhatsApp con IA en español** (`somosautoma.com`). Si un
   prospecto nos busca, puede encontrar a otro que vende lo que no queremos vender, y con un mensaje
   parecido.
2. **Marca registrada en México en las clases 35, 41 y 42** (LAYER7, agosto de 2026), una más en
   trámite en la 42, y solicitudes en Chile (35 y 42) y Brasil (35 y 42). Si algún día crecemos a
   México o vendemos cursos allá, chocamos.
3. **En Colombia, `automa.com.co` y el Instagram `automa_colombia` son de otra empresa** con más de
   20 años (audio y video profesional). No es nuestro sector, pero el `.com.co` y el usuario natural
   ya no están, y es probable que tengan la marca en la SIC en sus clases (no se pudo verificar).
4. **Búsquedas saturadas:** una plataforma de agentes de IA (`goautoma.com`) y una extensión de
   Chrome con ~200.000 usuarios se llaman Automa.
5. **Contradice el criterio de marca:** «Automa» viene de «autómata». Suena a bot y a «lo hace una
   máquina», justo la percepción de barato que queremos evitar, y envejece si el bot deja de ser el
   producto.
6. **Dominios:** `automa.com` está en venta y `automa.co` tiene dueño.

**Qué hacer con «Automa»:** se puede dejar como nombre interno del repositorio y del código. Para el
público, la plataforma de cursos debería llevar la marca de la agencia (por ejemplo «Firme Academia»).

---

## 7. Siguientes pasos (sin comprar ni registrar nada todavía)

1. **Búsqueda formal ante la SIC** de los dos primeros de la terna (idealmente con un abogado de
   marcas), en las clases 35, 41 y 42, por denominación y por similitud fonética. Desde este entorno
   el SIPI está bloqueado.
2. **RUES:** buscar razones sociales con «Firme» y «Rendo» en `https://www.rues.org.co/`.
3. **Instagram:** revisar a mano `@firme`, `@firmeco`, `@somosfirme`, `@rendo`, `@rendoco` y
   `@somosrendo` con sesión iniciada.
4. **Precio de `firme.com`** en Afternic, solo como referencia; no hace falta para arrancar.
5. Decidir y, solo entonces, comprar `firme.co`, `firme.com.co` y `somosfirme.com` (o los equivalentes
   del nombre elegido) y radicar la solicitud de marca con logotipo.

---

## 8. Aviso

**Esta revisión de marca es preliminar.** Se hizo con buscadores públicos y no incluye el registro
de la SIC, que no se pudo consultar. La Global Brand Database de la OMPI no contiene las marcas
nacionales colombianas. La disponibilidad de los dominios puede cambiar en cualquier momento.
**Antes de registrar la marca o comprar dominios hay que hacer la búsqueda formal de antecedentes
ante la SIC o con un abogado de marcas.** No se registró, compró ni llenó ningún formulario.
