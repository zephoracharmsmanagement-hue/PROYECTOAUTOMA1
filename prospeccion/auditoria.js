#!/usr/bin/env node
/**
 * auditoria.js — Auditoría técnica de conversión para prospección comercial.
 *
 * POR QUÉ EXISTE ESTE SCRIPT
 * Cada ficha que produce aquí termina en un video de 90 segundos que se le manda
 * a un desconocido dueño de tienda. Una afirmación falsa en ese video quema el
 * prospecto y la reputación de quien lo manda. Por eso el script está escrito
 * para *poder demostrar* cada dato, y para marcar explícitamente cuándo NO puede:
 * de ahí los campos `bloqueados`, `pixel.fiable` y `notas`.
 *
 * Uso:
 *   node prospeccion/auditoria.js                 # las 20 tiendas de la lista
 *   node prospeccion/auditoria.js dominio.com ... # solo esos dominios
 */

const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const espera = ms => new Promise(r => setTimeout(r, ms));

const DOMINIOS = [
  'sacriusshop.store', 'shop-rebel.co', 'chicsmovile.com', 'tiendamultimarca.com.co',
  'lotengotienda.com', 'tienda-del-valle.com', 'blasus.co', 'savatienda.com',
  'lummia.com.co', 'fantasiasnewyork.com', 'sowicolombia.myshopify.com', 'viveshop.website',
  'pintatienda.com', 'c6ac4e.myshopify.com', 'safeforyourdreamss.com', 'bestcool.online',
  'colchonesspring.com.co', 'nesimu.com', 'muchi.funnelish.com', 'karamelovirtual.com',
];

const DIR_FICHAS = path.join(__dirname, 'fichas');
const DIR_CAPTURAS = path.join(__dirname, 'capturas');

// Hosts cuyo bloqueo invalidaría el veredicto sobre el pixel: si no cargan,
// el pixel no puede inicializarse y la tienda PARECE no tenerlo aunque sí lo tenga.
const HOSTS_CRITICOS_PIXEL = ['connect.facebook.net', 'www.googletagmanager.com', 'googletagmanager.com'];

// Un `requestfailed` no es sinónimo de "bloqueado", y la diferencia decide si un
// dato se puede usar en el video o no. Hay tres casos muy distintos:
//   - ERR_ABORTED: el navegador cancela lo que estaba en vuelo al navegar. Ruido.
//   - fallo de transporte (DNS, túnel, conexión): puede ser NUESTRA red. Si afecta
//     a un host crítico, el veredicto del pixel deja de ser fiable.
//   - rechazo de la propia tienda (su CSP, ORB, BLOCKED_BY_RESPONSE): la medición
//     es válida; el que bloquea es el sitio, no nosotros. Eso puede ser incluso un
//     hallazgo real sobre la tienda, pero nunca una excusa de medición.
const RUIDO = /ERR_ABORTED/i;
const TRANSPORTE = /ERR_NAME_NOT_RESOLVED|ERR_TUNNEL|ERR_CONNECTION|ERR_PROXY|ERR_TIMED_OUT|ERR_BLOCKED_BY_CLIENT|ERR_SOCKET|ERR_ADDRESS|ERR_CERT|ERR_SSL|ERR_EMPTY_RESPONSE|ERR_FAILED/i;
const clasificarFallo = texto => {
  if (!texto || RUIDO.test(texto)) return null;
  return TRANSPORTE.test(texto) ? 'transporte' : 'tienda';
};

// 6 segundos es el mínimo: el pixel de Meta suele cargarse de forma diferida
// (GTM, Shopify web pixels, apps de terceros) y dispara PageView bastante
// después del DOMContentLoaded. Medir antes produciría "no tiene pixel" falsos.
const ESPERA_SCRIPTS = 6500;

/** Acepta el banner de cookies si lo hay: muchas tiendas retienen los scripts
 *  de marketing (incluido el pixel) hasta que hay consentimiento. Sin este paso,
 *  el veredicto del pixel sería el de un visitante que nunca aceptó. */
async function aceptarCookies(page) {
  return page.evaluate(() => {
    const ACEPTAR = /^(aceptar|aceptar todo|aceptar todas|aceptar cookies|acepto|entendido|de acuerdo|permitir|permitir todas|accept|accept all|allow all|got it|ok)\b/i;
    const nodos = [...document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]')];
    for (const n of nodos) {
      const txt = (n.innerText || n.value || '').trim();
      if (!txt || txt.length > 40 || !ACEPTAR.test(txt)) continue;
      // El texto "Aceptar" aparece también en checkouts y newsletters; exigimos que
      // el contenedor hable de cookies/privacidad para no pulsar otra cosa.
      let p = n, contexto = '';
      for (let i = 0; i < 6 && p; i++, p = p.parentElement) contexto += (p.innerText || '').slice(0, 600);
      if (!/cookie|privacidad|privacy|rastreo|tracking/i.test(contexto)) continue;
      const r = n.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      n.click();
      return txt;
    }
    return null;
  }).catch(() => null);
}

/** KB transferidos reales de la navegación actual. Se lee del Resource Timing del
 *  propio navegador (transferSize), que es el peso que paga el usuario en datos
 *  móviles, no el tamaño descomprimido. Hay que leerlo ANTES de navegar a otra
 *  página porque el buffer se reinicia en cada navegación. */
async function pesoDeLaPagina(page) {
  return page.evaluate(() => {
    try {
      const rs = performance.getEntriesByType('resource');
      const nav = performance.getEntriesByType('navigation')[0];
      const kb = rs.reduce((n, r) => n + (r.transferSize || 0), 0) + ((nav && nav.transferSize) || 0);
      return {
        kb: Math.round(kb / 1024),
        peticiones: rs.length,
        // domContentLoaded del propio navegador: segunda medida independiente del
        // cronómetro de Playwright, para detectar números raros antes de publicarlos.
        dcl_navegador: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      };
    } catch { return { kb: null, peticiones: null, dcl_navegador: null }; }
  }).catch(() => ({ kb: null, peticiones: null, dcl_navegador: null }));
}

/** Identifica la plataforma porque determina qué se puede arreglar y cómo:
 *  en Shopify el pixel se corrige en 10 minutos, en un funnel a medida no. */
async function detectarPlataforma(page) {
  return page.evaluate(() => {
    const html = document.documentElement.innerHTML;
    const gen = (document.querySelector('meta[name="generator"]') || {}).content || '';
    if (window.Shopify || /cdn\.shopify\.com|myshopify\.com/.test(html)) return 'Shopify';
    if (/funnelish/i.test(html)) return 'Funnelish';
    if (window.LS || /tiendanube|mitiendanube|nuvemshop/i.test(html)) return 'Tiendanube';
    if (/wp-content|wp-includes|woocommerce/i.test(html)) return /woocommerce/i.test(html) ? 'WooCommerce' : 'WordPress';
    if (/vtex/i.test(html)) return 'VTEX';
    if (/wixstatic|wix\.com/i.test(html)) return 'Wix';
    if (/squarespace/i.test(html)) return 'Squarespace';
    if (/jumpseller/i.test(html)) return 'Jumpseller';
    if (/prestashop/i.test(html)) return 'PrestaShop';
    if (/magento|mage-/i.test(html)) return 'Magento';
    if (/bigcommerce/i.test(html)) return 'BigCommerce';
    if (/ecwid/i.test(html)) return 'Ecwid';
    if (/empretienda/i.test(html)) return 'Empretienda';
    if (/shopify/i.test(html)) return 'Shopify';
    return gen ? 'otra (' + gen.slice(0, 40) + ')' : 'otra / a medida';
  }).catch(() => null);
}

/** WhatsApp: en Colombia es el canal de cierre. Su ausencia (o su presencia sin
 *  mensaje pre-rellenado) es un hallazgo vendible y verificable. */
async function detectarWhatsapp(page) {
  return page.evaluate(() => {
    const sel = 'a[href*="wa.me"],a[href*="api.whatsapp"],a[href*="whatsapp.com/send"],a[href*="web.whatsapp"]';
    const as = [...document.querySelectorAll(sel)];
    return {
      presente: as.length > 0,
      enlaces: as.slice(0, 3).map(a => a.getAttribute('href').slice(0, 160)),
      // Un wa.me sin ?text= obliga al cliente a escribir primero: fricción medible.
      con_mensaje: as.some(a => /[?&]text=/.test(a.getAttribute('href') || '')),
    };
  }).catch(() => ({ presente: false, enlaces: [], con_mensaje: false }));
}

/** Busca el primer enlace a una ficha de producto. Se prueban varios patrones
 *  porque cada plataforma los nombra distinto, y se evita el carrito/checkout
 *  para no tocar nada del embudo real de la tienda. */
async function buscarEnlaceProducto(page) {
  return page.evaluate(() => {
    const malos = /carrito|cart|checkout|account|cuenta|login|policies|politica|blog|#|javascript:/i;
    const buenos = [/\/products?\//i, /\/productos?\//i, /\/producto-/i, /\/p\//i, /\/item\//i, /\/shop\/[^/]+\/?$/i, /\/tienda\/[^/]+\/?$/i];
    const hrefs = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(Boolean);
    for (const pat of buenos) {
      const h = hrefs.find(x => pat.test(x) && !malos.test(x));
      if (h) return h;
    }
    return null;
  }).catch(() => null);
}

/** ¿La portada ES la ficha de producto? Es el caso normal en funnels de una sola
 *  página (Funnelish y similares). Distinguirlo evita escribir "no tiene ficha de
 *  producto" cuando en realidad toda la tienda es una ficha de producto. */
async function portadaEsProducto(page) {
  return page.evaluate(() => {
    const t = document.body.innerText.slice(0, 30000);
    const botonCompra = !!document.querySelector(
      'form[action*="/cart"] [type="submit"], button[name="add"], .add-to-cart, [class*="add-to-cart"], [id*="addToCart"], [class*="buy-now"], [name="add"]');
    const precio = /\$\s?\d{1,3}([.,]\d{3})+/.test(t);
    const pedir = /(comprar ahora|lo quiero|agregar al carrito|pedir ahora|ordenar ahora|añadir al carrito)/i.test(t);
    return (botonCompra || pedir) && precio;
  }).catch(() => false);
}

/** Señales de confianza y de pago que en Colombia mueven la conversión:
 *  reseñas visibles, contraentrega y cuotas (Addi / Sistecrédito). */
async function señalesDeFicha(page) {
  return page.evaluate(() => {
    const txt = document.body.innerText.slice(0, 40000);
    const html = document.documentElement.innerHTML;
    return {
      // Se exige una señal concreta de reseña (estrellas, "N reseñas", widget
      // conocido) en vez de la palabra sola: "reseñas" aparece en menús y en
      // pies de página de tiendas que no tienen ninguna reseña publicada.
      resenas: /(\d+\s*(rese(ñ|n)as?|opiniones|reviews?))|(★|⭐){1,}|\b\d[.,]\d\s*(de\s*5|\/\s*5)\b/i.test(txt)
               || /judge\.me|loox|stamped|okendo|yotpo|reviews\.io|trustpilot|opinew|rivyo|ryviu|jdgm/i.test(html),
      resenas_pista_textual: /rese(ñ|n)a|opinion|review|valoracion/i.test(txt),
      contraentrega: /contra\s?entrega|contraentrega|pago al recibir|pagas al recibir|paga(s)? cuando recibas|pago contra entrega/i.test(txt),
      cuotas: /\baddi\b|sistecr(e|é)dito|cuotas sin inter(e|é)s|hasta \d+ cuotas|\b[2-9] cuotas\b|paga en cuotas/i.test(txt),
      // Un envío gratis anunciado en la ficha es palanca; su ausencia también se dice.
      envio_gratis: /env(í|i)o gratis|env(í|i)os gratis|free shipping/i.test(txt),
    };
  }).catch(() => ({}));
}

/** Captura pensada para el video: el "fold" móvil, que es exactamente lo que ve
 *  el visitante que llega del anuncio. Antes se baja y se sube para forzar la
 *  carga de las imágenes diferidas, si no la captura sale con huecos grises. */
async function capturar(page, destino) {
  try {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
    await espera(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await espera(1500);
    await page.screenshot({ path: destino, fullPage: false });
    return path.basename(destino);
  } catch { return null; }
}

/** Cuando la portada no carga hay que distinguir dos cosas muy distintas: que la
 *  tienda esté caída / no exista, o que sea NUESTRA red la que no llega. Se
 *  pregunta a un resolutor DNS público e independiente (DNS-over-HTTPS): si
 *  responde NXDOMAIN con autoridad del TLD, el dominio no existe y eso sí se
 *  puede afirmar. Si resuelve bien, el problema es nuestro y hay que decirlo. */
async function verificarDns(ctx, dominio) {
  const p = await ctx.newPage();
  try {
    const r = await p.goto('https://dns.google/resolve?name=' + encodeURIComponent(dominio) + '&type=A', { timeout: 25000 });
    const j = JSON.parse(await r.text());
    const ips = (j.Answer || []).filter(a => a.type === 1).map(a => a.data);
    if (j.Status === 3) return { resuelve: false, veredicto: 'NXDOMAIN: el dominio no existe en el DNS (respuesta autoritativa del TLD). Quien haga clic en un anuncio que apunte aquí no llega a ninguna página.', ips: [] };
    if (ips.length) return { resuelve: true, veredicto: 'el dominio sí resuelve (' + ips.join(', ') + '), así que el fallo de carga NO es del DNS: puede ser el servidor de la tienda o nuestra propia red. No se puede culpar a la tienda sin más comprobaciones.', ips };
    return { resuelve: null, veredicto: 'el DNS respondió con estado ' + j.Status + ' y sin dirección IP; no es concluyente.', ips: [] };
  } catch (e) {
    return { resuelve: null, veredicto: 'no se pudo consultar el DNS de forma independiente: ' + e.message.split('\n')[0], ips: [] };
  } finally { await p.close().catch(() => {}); }
}

async function auditar(browser, dominio) {
  const f = {
    dominio,
    fecha: new Date().toISOString().slice(0, 10),
    plataforma: null,
    pixel: {
      script: false, ids: [], eventos: [],
      eventos_home: [], eventos_producto: [],   // separados: "no dispara ViewContent en la ficha" es un hallazgo distinto a "no dispara nada"
      fbq_en_window: false, ids_en_html: [], cookie_fbp: null, gtm: false,
      avisos_consola: [],                       // diagnóstico que Meta imprime en la consola del visitante: es prueba directa
      fiable: null, nota: null,
    },
    errores_js: [],
    bloqueados: [],                 // hosts que NO pudimos ver (posible culpa de nuestra red)
    rechazados_por_la_tienda: [],   // hosts que el propio sitio rechaza (CSP/ORB): medición válida
    fallos_red: [],
    banner_cookies: null,
    home: {},
    producto: {},
    capturas: {},
    notas: [],
  };

  const bloqueados = new Set();
  const rechazados = new Set();
  const fallos = [];
  let fase = 'home';   // en qué página estamos cuando llega cada evento del pixel

  // Contexto nuevo por tienda: caché y cookies en frío. Si se reutilizara el
  // contexto, la segunda tienda mediría menos KB solo por compartir CDN y los
  // números dejarían de ser comparables.
  const ctx = await browser.newContext({
    ...devices['Pixel 7'],
    // Se fija a 2 (en vez del 2.625 real del Pixel 7) porque es lo pedido para el
    // video: imágenes nítidas y de tamaño manejable en montaje.
    deviceScaleFactor: 2,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
  });
  const page = await ctx.newPage();

  // Los oyentes van en el CONTEXTO, no en la pestaña: el pixel de Shopify ("web
  // pixels") y muchas apps disparan desde un iframe aislado o un worker, y a nivel
  // de pestaña esos eventos se pierden. Perderlos produciría el peor error posible:
  // decirle a una tienda que no dispara eventos cuando sí los dispara.
  ctx.on('request', r => {
    const u = r.url();
    if (/connect\.facebook\.net\/.*\/fbevents\.js/.test(u)) f.pixel.script = true;
    if (/googletagmanager\.com\/(gtm\.js|gtag\/js)/.test(u)) f.pixel.gtm = true;
    // La prueba de que el pixel no solo está instalado sino que dispara. Los eventos
    // viajan en la query (GET) o, cuando el payload crece, en el cuerpo (POST): hay
    // que mirar los dos sitios o se cuentan menos eventos de los reales.
    if (!/facebook\.com\/(tr|privacy_sandbox\/pixel\/register\/trigger)/.test(u)) return;
    const fuentes = [u.includes('?') ? u.slice(u.indexOf('?') + 1) : ''];
    if (r.method() === 'POST') { try { fuentes.push(r.postData() || ''); } catch {} }
    for (const fuente of fuentes) {
      if (!fuente) continue;
      let p; try { p = new URLSearchParams(fuente); } catch { continue; }
      const ev = p.get('ev'), id = p.get('id');
      if (id && !f.pixel.ids.includes(id)) f.pixel.ids.push(id);
      if (!ev) continue;
      if (!f.pixel.eventos.includes(ev)) f.pixel.eventos.push(ev);
      const lista = fase === 'home' ? f.pixel.eventos_home : f.pixel.eventos_producto;
      if (!lista.includes(ev)) lista.push(ev);
    }
  });
  ctx.on('requestfailed', r => {
    const motivo = (r.failure() && r.failure().errorText) || '';
    const clase = clasificarFallo(motivo);
    if (!clase) return;
    try {
      const host = new URL(r.url()).hostname;
      (clase === 'transporte' ? bloqueados : rechazados).add(host);
      if (fallos.length < 25) fallos.push({ host, motivo, clase });
    } catch {}
  });

  // La propia librería de Meta imprime en la consola por qué no está midiendo
  // (pixel deshabilitado por permisos de tráfico, IDs duplicados, parámetros
  // inválidos...). Es la prueba más sólida y más fácil de mostrar en un video:
  // sale del código de Meta, no de nuestra interpretación.
  page.on('console', m => {
    const t = (m.text() || '').trim();
    // Solo los mensajes que emite la librería de Meta (empiezan por "[Meta"). Un
    // mensaje de CSP que de paso nombra facebook.net no dice nada del pixel y
    // ensuciaría la ficha con falsos indicios.
    if (!/^\[Meta/i.test(t)) return;
    const limpio = t.slice(0, 220);
    if (!f.pixel.avisos_consola.includes(limpio) && f.pixel.avisos_consola.length < 10) f.pixel.avisos_consola.push(limpio);
  });
  // Un error de JavaScript en la ficha de producto suele romper el botón de compra:
  // se guarda porque es un fallo de conversión demostrable, no una opinión.
  page.on('pageerror', e => {
    const t = (e.message || String(e)).split('\n')[0].slice(0, 180);
    if (!f.errores_js.includes(t) && f.errores_js.length < 6) f.errores_js.push(`[${fase}] ${t}`);
  });

  // ---------- PORTADA ----------
  const t0 = Date.now();
  let resp = null;
  try {
    resp = await page.goto('https://' + dominio, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    f.notas.push('primer intento de carga falló: ' + e.message.split('\n')[0]);
    try {
      resp = await page.goto('https://' + dominio, { waitUntil: 'commit', timeout: 60000 });
    } catch (e2) {
      f.error = e2.message.split('\n')[0];
      f.dns = await verificarDns(ctx, dominio);
      f.notas.push('la portada no cargó. Comprobación DNS independiente: ' + f.dns.veredicto);
      f.bloqueados = [...bloqueados];
      f.rechazados_por_la_tienda = [...rechazados];
      f.fallos_red = fallos;
      f.pixel.fiable = false;
      f.pixel.nota = 'NO FIABLE: la página no cargó, no se midió nada del pixel.';
      await ctx.close();
      return f;
    }
  }
  f.home.ttdom_ms = Date.now() - t0;
  f.home.estado = resp && resp.status();
  f.home.url_final = page.url().slice(0, 160);

  await espera(ESPERA_SCRIPTS);

  const cookies = await aceptarCookies(page);
  if (cookies) {
    f.banner_cookies = cookies;
    f.notas.push(`banner de cookies aceptado ("${cookies}") y página recargada: sin eso los scripts de marketing podían quedar retenidos`);
    // Recarga tras el consentimiento: algunos CMP solo inyectan el pixel en la
    // siguiente carga. Los tiempos se conservan de la PRIMERA carga, que es la
    // que vive el visitante que llega del anuncio.
    try { await page.goto('https://' + dominio, { waitUntil: 'domcontentloaded', timeout: 60000 }); await espera(ESPERA_SCRIPTS); } catch {}
  }

  f.home.titulo = (await page.title().catch(() => '')).slice(0, 120);
  f.plataforma = await detectarPlataforma(page);
  f.home.whatsapp = await detectarWhatsapp(page);
  f.home.imagenes = await page.locator('img').count().catch(() => null);
  const pesoHome = await pesoDeLaPagina(page);
  f.home.kb = pesoHome.kb; f.home.peticiones = pesoHome.peticiones; f.home.dcl_navegador_ms = pesoHome.dcl_navegador;

  // Rastro del pixel en el propio documento: si `fbq` existe o hay un init con ID
  // en el HTML, el pixel está instalado aunque no haya disparado ningún evento.
  // Esa distinción es la diferencia entre un hallazgo honesto y uno falso.
  const rastro = await page.evaluate(() => {
    const html = document.documentElement.innerHTML;
    const ids = new Set();
    for (const m of html.matchAll(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{8,20})['"]/g)) ids.add(m[1]);
    for (const m of html.matchAll(/(?:facebook_pixel_id|pixel_id|fbPixelId)['"]?\s*[:=]\s*['"]?(\d{8,20})/gi)) ids.add(m[1]);
    // _fbp solo existe si el pixel llegó a ejecutarse de verdad en el navegador.
    return { fbq: typeof window.fbq === 'function', ids: [...ids].slice(0, 5), fbp: /(^|;\s*)_fbp=/.test(document.cookie) };
  }).catch(() => ({ fbq: false, ids: [], fbp: null }));
  f.pixel.fbq_en_window = rastro.fbq;
  f.pixel.ids_en_html = rastro.ids;
  f.pixel.cookie_fbp = rastro.fbp;

  f.capturas.portada = await capturar(page, path.join(DIR_CAPTURAS, `${dominio}-portada.png`));

  // ---------- FICHA DE PRODUCTO ----------
  const enlace = await buscarEnlaceProducto(page);
  fase = 'producto';
  if (enlace) {
    const url = enlace.startsWith('http') ? enlace
      : new URL(enlace, page.url()).toString();
    const t1 = Date.now();
    try {
      const r2 = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      f.producto.ttdom_ms = Date.now() - t1;
      f.producto.estado = r2 && r2.status();
      f.producto.url = url.slice(0, 180);
      await espera(ESPERA_SCRIPTS);
      Object.assign(f.producto, await señalesDeFicha(page));
      const pesoProd = await pesoDeLaPagina(page);
      f.producto.kb = pesoProd.kb; f.producto.peticiones = pesoProd.peticiones; f.producto.dcl_navegador_ms = pesoProd.dcl_navegador;
      f.producto.imagenes = await page.locator('img').count().catch(() => null);
      f.producto.whatsapp = (await detectarWhatsapp(page)).presente;
      f.capturas.producto = await capturar(page, path.join(DIR_CAPTURAS, `${dominio}-producto.png`));
    } catch (e) {
      f.producto.error = e.message.split('\n')[0];
    }
  } else if (await portadaEsProducto(page)) {
    // Funnel de una sola página: la portada es la ficha. Se mide ahí mismo y se
    // deja constancia, para no reportar "no hay ficha de producto".
    f.producto.es_la_portada = true;
    f.producto.url = f.home.url_final;
    f.producto.ttdom_ms = f.home.ttdom_ms;
    f.producto.kb = f.home.kb;
    f.producto.peticiones = f.home.peticiones;
    f.producto.imagenes = f.home.imagenes;
    Object.assign(f.producto, await señalesDeFicha(page));
    f.notas.push('la portada es la propia ficha de producto (embudo de una sola página): las medidas de producto son las de la portada');
    f.capturas.producto = await capturar(page, path.join(DIR_CAPTURAS, `${dominio}-producto.png`));
  } else {
    f.notas.push('no se encontró enlace a una ficha de producto desde la portada');
  }

  // ---------- VEREDICTO DE FIABILIDAD ----------
  f.bloqueados = [...bloqueados];
  f.rechazados_por_la_tienda = [...rechazados];
  f.fallos_red = fallos;
  const nuestroBloqueo = HOSTS_CRITICOS_PIXEL.filter(h => bloqueados.has(h));
  const bloqueoDeLaTienda = HOSTS_CRITICOS_PIXEL.filter(h => rechazados.has(h));
  const avisoMeta = f.pixel.avisos_consola.find(a => /unavailable|traffic permission|duplicate pixel|not allowed/i.test(a));
  if (f.pixel.eventos.length) {
    f.pixel.fiable = true;
    f.pixel.nota = 'se interceptaron eventos reales del pixel: lo medido es lo que pasa de verdad';
  } else if (avisoMeta) {
    // Meta explica ella misma por qué no mide: no hay ambigüedad que resolver.
    f.pixel.fiable = true;
    f.pixel.nota = 'el script del pixel carga pero no envía ningún evento, y la propia librería de Meta explica por qué en la consola: "' + avisoMeta + '"';
  } else if (f.pixel.script) {
    f.pixel.fiable = true;
    f.pixel.nota = 'el script del pixel cargó, así que la medición es válida; ver eventos interceptados';
  } else if (nuestroBloqueo.length) {
    // Única situación en la que NO se puede decir nada del pixel en el video.
    f.pixel.fiable = false;
    f.pixel.nota = 'NO FIABLE: ' + nuestroBloqueo.join(', ') + ' no cargó por un fallo de red en la medición, así que el pixel no pudo inicializarse. No se puede afirmar nada sobre su pixel.';
  } else if (bloqueoDeLaTienda.length) {
    f.pixel.fiable = true;
    f.pixel.nota = 'el propio sitio (su CSP o su configuración) impide cargar ' + bloqueoDeLaTienda.join(', ') + ': el pixel no puede funcionar en el navegador del visitante';
  } else {
    f.pixel.fiable = true;
    f.pixel.nota = rastro.fbq || rastro.ids.length
      ? 'el pixel está instalado en el HTML pero no se interceptó ningún evento en el navegador durante la visita'
      : 'no se detectó ningún evento de pixel en el navegador; podría usar la API de Conversiones (servidor), que es legítima y no se ve desde aquí';
  }

  await ctx.close();
  return f;
}

(async () => {
  fs.mkdirSync(DIR_FICHAS, { recursive: true });
  fs.mkdirSync(DIR_CAPTURAS, { recursive: true });
  const objetivos = process.argv.slice(2).length ? process.argv.slice(2) : DOMINIOS;
  const browser = await chromium.launch();
  for (const d of objetivos) {
    const t = Date.now();
    let ficha;
    try {
      ficha = await auditar(browser, d);
    } catch (e) {
      ficha = { dominio: d, fecha: new Date().toISOString().slice(0, 10), error: 'fallo del auditor: ' + e.message.split('\n')[0] };
    }
    ficha.duracion_auditoria_s = Math.round((Date.now() - t) / 1000);
    fs.writeFileSync(path.join(DIR_FICHAS, d + '.json'), JSON.stringify(ficha, null, 2) + '\n');
    console.log(`[${d}] ${ficha.error ? 'ERROR: ' + ficha.error : `plataforma=${ficha.plataforma} pixel=${ficha.pixel.eventos.join('/') || 'sin eventos'} fiable=${ficha.pixel.fiable} home=${ficha.home.ttdom_ms}ms/${ficha.home.kb}KB prod=${ficha.producto.ttdom_ms || '-'}ms/${ficha.producto.kb || '-'}KB`} (${ficha.duracion_auditoria_s}s)`);
  }
  await browser.close();
})();
