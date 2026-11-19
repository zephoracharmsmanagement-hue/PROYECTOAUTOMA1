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

// Ventana de observación por página. Empezamos en 6,5 s y lo comprobamos: con
// 6,5 s cuatro tiendas medidas (lotengotienda, savatienda, lummia, viveshop)
// daban CERO eventos, y con 25 s las cuatro disparaban PageView. Es decir, la
// espera corta fabricaba el hallazgo falso más caro posible ("no mide nada").
// Se fija en 30 s IGUAL para todas, para que la frase "en 30 segundos de
// observación no disparó X" signifique lo mismo en las 20 fichas.
const VENTANA_MS = 30000;

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

/** Encuentra una ficha de producto de verdad. Tres vías, en orden de fiabilidad,
 *  porque una tienda sin ficha medida es una ficha incompleta y porque "no tiene
 *  ficha de producto" sería falso en tiendas cuyo catálogo simplemente no está
 *  enlazado desde la portada (que ya es, en sí, un hallazgo aparte). */
async function descubrirProducto(ctx, page, dominio) {
  const absoluta = h => { try { return new URL(h, page.url()).toString(); } catch { return null; } };

  const directo = await buscarEnlaceProducto(page);
  if (directo) return { url: absoluta(directo), via: 'enlace directo desde la portada' };

  // Shopify publica su catálogo en /products.json. Es una lectura pública, sin
  // efectos sobre la tienda, y evita adivinar URLs.
  if (await page.evaluate(() => !!window.Shopify).catch(() => false)) {
    const aux = await ctx.newPage();
    try {
      const r = await aux.goto(absoluta('/products.json?limit=1'), { timeout: 30000 });
      const j = JSON.parse(await r.text());
      const handle = j.products && j.products[0] && j.products[0].handle;
      if (handle) return { url: absoluta('/products/' + handle), via: 'catálogo público /products.json (la portada no enlaza ningún producto)' };
    } catch {} finally { await aux.close().catch(() => {}); }
  }

  // Último recurso: entrar a un listado de categoría y buscar el producto allí.
  const catalogo = await page.evaluate(() => {
    const pats = [/\/collections?\//i, /\/products\?/i, /\/categor/i, /\/catalogo/i, /\/tienda\/?$/i, /\/shop\/?$/i, /\/productos?\/?$/i];
    const hrefs = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(Boolean);
    for (const pat of pats) { const h = hrefs.find(x => pat.test(x) && !/carrito|cart|checkout|account/i.test(x)); if (h) return h; }
    return null;
  }).catch(() => null);
  if (catalogo) {
    const aux = await ctx.newPage();
    try {
      await aux.goto(absoluta(catalogo), { waitUntil: 'domcontentloaded', timeout: 45000 });
      await espera(4000);
      const h = await buscarEnlaceProducto(aux);
      if (h) return { url: new URL(h, aux.url()).toString(), via: 'a través del listado ' + catalogo.slice(0, 60) + ' (la portada no enlaza ningún producto)' };
    } catch {} finally { await aux.close().catch(() => {}); }
  }
  return null;
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
    const r = {};

    // RESEÑAS. La versión anterior daba por buena cualquier estrella en el texto,
    // y eso marcaba "tiene reseñas" en fichas cuyo TÍTULO llevaba ⭐⭐⭐⭐⭐ de
    // adorno. Ahora hace falta una prueba de reseña real (un recuento, una nota
    // sobre 5 o un widget de reseñas conocido) y se guarda qué la activó, para
    // que la afirmación se pueda comprobar sin volver a la tienda.
    const pruebas = [];
    // El número no puede venir pegado a un decimal: sin esto, "5.0 reseñas"
    // se leía como "0 reseñas" y la ficha afirmaba lo contrario de la realidad.
    const recuento = txt.match(/(?<![\d.,])\d+\s*(rese(ñ|n)as?|opiniones|reviews?|valoraciones)/i);
    if (recuento) pruebas.push('recuento en el texto: "' + recuento[0].trim() + '"');
    const nota = txt.match(/\b\d[.,]\d\s*(de\s*5|\/\s*5|estrellas)/i);
    if (nota) pruebas.push('nota media: "' + nota[0].trim() + '"');
    const widget = /judge\.?me|jdgm|loox|stamped\.io|okendo|yotpo|reviews\.io|opinew|rivyo|ryviu|growave|ali-?reviews/i.exec(html);
    if (widget) pruebas.push('widget de reseñas: ' + widget[0]);
    r.resenas = pruebas.length > 0;
    r.resenas_evidencia = pruebas.slice(0, 3);
    // Caso aparte y honesto: estrellas de adorno sin ninguna reseña detrás.
    r.estrellas_decorativas = !r.resenas && /(★|⭐)/.test(txt);

    const cEntrega = txt.match(/contra\s?entrega|contraentrega|pago al recibir|pagas al recibir|paga(s)? cuando recibas/i);
    r.contraentrega = !!cEntrega;
    if (cEntrega) r.contraentrega_evidencia = cEntrega[0].trim();

    const cuota = txt.match(/\baddi\b|sistecr(e|é)dito|cuotas sin inter(e|é)s|hasta \d+ cuotas|\b[2-9] cuotas\b|paga en cuotas/i);
    r.cuotas = !!cuota;
    if (cuota) r.cuotas_evidencia = cuota[0].trim();

    r.envio_gratis = /env(í|i)o(s)? gratis|free shipping/i.test(txt);
    // Muro de registro: si para ver o comprar hay que crear cuenta, el tráfico
    // del anuncio no puede comprar, y eso vale más que cualquier métrica de peso.
    r.muro_de_registro = /(iniciar sesi(ó|o)n|reg(í|i)strate|registrarse|crear cuenta)/i.test(txt.slice(0, 2500))
      && !!document.querySelector('input[type="password"]');
    return r;
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

/** Extrae los campos de un envío del pixel. Estas tiendas mandan los eventos por
 *  POST en multipart/form-data, no en la query ni en urlencoded: sin entender el
 *  multipart se ve que la tienda envía algo pero no QUÉ envía, y entonces no se
 *  puede decir ni "dispara ViewContent" ni lo contrario. */
function leerCampos(cuerpo) {
  const campos = {};
  if (!cuerpo) return campos;
  if (/Content-Disposition/i.test(cuerpo)) {
    for (const m of cuerpo.matchAll(/name="([^"]+)"\r?\n\r?\n([\s\S]*?)\r?\n--/g)) campos[m[1]] = m[2].trim();
    return campos;
  }
  try { for (const [k, v] of new URLSearchParams(cuerpo)) campos[k] = v; } catch {}
  return campos;
}

async function auditar(browser, dominio) {
  const f = {
    dominio,
    fecha: new Date().toISOString().slice(0, 10),
    plataforma: null,
    pixel: {
      script: false, ids: [], eventos: [],
      eventos_home: [], eventos_producto: [],   // separados: "no dispara ViewContent en la ficha" es un hallazgo distinto a "no dispara nada"
      peticiones_tr: 0,                         // nº de envíos reales a facebook.com/tr
      eventos_sin_nombre: 0,                    // envíos cuyo nombre de evento no se pudo leer
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

  // Playwright devuelve null para estos cuerpos; el protocolo de depuración de
  // Chrome sí los conserva, así que es la única vía para leer el nombre del
  // evento sin modificar la página de la tienda.
  const anotarEvento = (ev, id) => {
    if (id && !f.pixel.ids.includes(id)) f.pixel.ids.push(id);
    if (!ev) return;
    if (!f.pixel.eventos.includes(ev)) f.pixel.eventos.push(ev);
    const lista = fase === 'home' ? f.pixel.eventos_home : fase === 'producto' ? f.pixel.eventos_producto : null;
    if (lista && !lista.includes(ev)) lista.push(ev);
  };
  try {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    // Los pixels de Shopify disparan desde un iframe aislado: sin autoAttach sus
    // envíos no se verían y la tienda parecería no medir nada.
    await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }).catch(() => {});
    cdp.on('Network.requestWillBeSent', async e => {
      const u = e.request.url;
      if (!/facebook\.com\/(tr|privacy_sandbox\/pixel\/register\/trigger)/.test(u)) return;
      let cuerpo = e.request.postData || '';
      if (!cuerpo && e.request.hasPostData) {
        try { cuerpo = (await cdp.send('Network.getRequestPostData', { requestId: e.requestId })).postData || ''; } catch {}
      }
      const deQuery = leerCampos(u.includes('?') ? u.slice(u.indexOf('?') + 1) : '');
      const deCuerpo = leerCampos(cuerpo);
      anotarEvento(deQuery.ev || deCuerpo.ev, deQuery.id || deCuerpo.id);
    });
  } catch (e) {
    f.notas.push('no se pudo abrir la sesión de depuración para leer los eventos del pixel: ' + e.message.split('\n')[0]);
  }


  // Los oyentes van en el CONTEXTO, no en la pestaña: el pixel de Shopify ("web
  // pixels") y muchas apps disparan desde un iframe aislado o un worker, y a nivel
  // de pestaña esos eventos se pierden. Perderlos produciría el peor error posible:
  // decirle a una tienda que no dispara eventos cuando sí los dispara.
  ctx.on('request', r => {
    const u = r.url();
    if (/connect\.facebook\.net\/.*\/fbevents\.js/.test(u)) f.pixel.script = true;
    if (/googletagmanager\.com\/(gtm\.js|gtag\/js)/.test(u)) f.pixel.gtm = true;
    // La prueba de que el pixel dispara es la petición a facebook.com/tr. Hay dos
    // formas de envío y las dos cuentan:
    //   - GET con los datos en la query (integraciones clásicas).
    //   - POST con los datos en el cuerpo, que es lo que usan la mayoría de estas
    //     tiendas. Leer solo la query hacía que estas salieran con CERO eventos
    //     teniendo el pixel funcionando: el falso negativo más caro del informe.
    // Por eso se cuenta SIEMPRE la petición, y aparte se intenta leer el nombre
    // del evento; si el cuerpo no se puede leer, se dice así en vez de callarlo.
    if (!/facebook\.com\/(tr|privacy_sandbox\/pixel\/register\/trigger)/.test(u)) return;
    f.pixel.peticiones_tr++;
    const fuentes = [u.includes('?') ? u.slice(u.indexOf('?') + 1) : ''];
    if (r.method() === 'POST') {
      // postDataBuffer() lee cuerpos que postData() devuelve como null.
      try { const b = r.postDataBuffer(); if (b) fuentes.push(b.toString('utf8')); } catch {}
    }
    let nombrado = false;
    for (const fuente of fuentes) {
      if (!fuente) continue;
      let p; try { p = new URLSearchParams(fuente); } catch { continue; }
      const ev = p.get('ev'), id = p.get('id');
      if (id && !f.pixel.ids.includes(id)) f.pixel.ids.push(id);
      if (!ev) continue;
      nombrado = true;
      if (!f.pixel.eventos.includes(ev)) f.pixel.eventos.push(ev);
      // Durante el descubrimiento del enlace de producto navegamos por catálogos:
      // esos eventos no son "de la portada" ni "de la ficha", así que no se
      // atribuyen a ninguna de las dos para no inventar un ViewContent.
      const lista = fase === 'home' ? f.pixel.eventos_home : fase === 'producto' ? f.pixel.eventos_producto : null;
      if (lista && !lista.includes(ev)) lista.push(ev);
    }
    if (!nombrado) f.pixel.eventos_sin_nombre++;
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
  // Se prueba el dominio tal cual y, si no responde, www. Hay dominios cuyo
  // ápice no tiene registro A y que solo funcionan con www: medir solo el ápice
  // haría escribir "su tienda no carga" cuando la tienda existe y vende.
  const candidatos = ['https://' + dominio];
  let resp = null, t0 = 0;
  for (const base of candidatos) {
    t0 = Date.now();
    try {
      resp = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
      f.url_medida = base;
      break;
    } catch (e) {
      f.notas.push('no cargó ' + base + ': ' + e.message.split('\n')[0]);
      if (!f.dns) {
        f.dns = await verificarDns(ctx, dominio);
        f.notas.push('comprobación DNS independiente de ' + dominio + ': ' + f.dns.veredicto);
      }
      if (candidatos.length === 1 && !dominio.startsWith('www.')) {
        f.dns_www = await verificarDns(ctx, 'www.' + dominio);
        if (f.dns_www.resuelve) {
          candidatos.push('https://www.' + dominio);
          f.notas.push('www.' + dominio + ' sí resuelve (' + f.dns_www.ips.join(', ') + '): la medición se hace ahí, no en el ápice');
        }
      }
    }
  }
  if (!resp) {
    f.error = 'la portada no cargó en ninguna de las direcciones probadas: ' + candidatos.join(', ');
    f.bloqueados = [...bloqueados];
    f.rechazados_por_la_tienda = [...rechazados];
    f.fallos_red = fallos;
    f.pixel.fiable = false;
    f.pixel.nota = 'NO FIABLE: la página no cargó, no se midió nada del pixel.';
    await ctx.close();
    return f;
  }
  f.home.ttdom_ms = Date.now() - t0;
  f.home.estado = resp && resp.status();
  f.home.url_final = page.url().slice(0, 160);

  await espera(VENTANA_MS);

  const cookies = await aceptarCookies(page);
  if (cookies) {
    f.banner_cookies = cookies;
    f.notas.push(`banner de cookies aceptado ("${cookies}") y página recargada: sin eso los scripts de marketing podían quedar retenidos`);
    // Recarga tras el consentimiento: algunos CMP solo inyectan el pixel en la
    // siguiente carga. Los tiempos se conservan de la PRIMERA carga, que es la
    // que vive el visitante que llega del anuncio.
    try { await page.goto(f.url_medida, { waitUntil: 'domcontentloaded', timeout: 60000 }); await espera(VENTANA_MS); } catch {}
  }

  f.home.titulo = (await page.title().catch(() => '')).slice(0, 120);
  // Se guarda el principio del texto visible como evidencia bruta: permite
  // comprobar después si lo que se midió era la tienda o una página de error.
  f.home.texto_inicio = (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 300)).catch(() => '')) || '';
  f.home.pagina_de_error = /404|not found|no se encontr|p(á|a)gina no encontrada|no existe/i.test(f.home.titulo + ' ' + f.home.texto_inicio)
    || (f.home.estado >= 400);
  if (f.home.pagina_de_error) f.notas.push('ATENCIÓN: lo que responde este dominio parece una página de error, no una tienda (estado HTTP ' + f.home.estado + ')');
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
  fase = 'descubrimiento';
  const hallazgo = await descubrirProducto(ctx, page, dominio);
  fase = 'producto';
  if (hallazgo && hallazgo.url) {
    const url = hallazgo.url;
    const t1 = Date.now();
    try {
      const r2 = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      f.producto.ttdom_ms = Date.now() - t1;
      f.producto.estado = r2 && r2.status();
      f.producto.url = url.slice(0, 180);
      f.producto.via = hallazgo.via;
      await espera(VENTANA_MS);
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
    // Sin ficha de producto no se inventa una captura llamada "-producto": se
    // guarda lo que sí había, con un nombre que no se puede confundir, para que
    // el video pueda mostrar la evidencia de lo que falta.
    f.notas.push('no se encontró ninguna ficha de producto navegable desde la portada ni desde el catálogo');
    Object.assign(f.producto, await señalesDeFicha(page));
    f.producto.sin_ficha = true;
    f.capturas.sin_ficha_de_producto = await capturar(page, path.join(DIR_CAPTURAS, `${dominio}-sin-ficha-de-producto.png`));
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
  } else if (f.pixel.peticiones_tr > 0) {
    f.pixel.fiable = true;
    f.pixel.nota = 'el pixel SÍ envía datos (' + f.pixel.peticiones_tr + ' envíos a facebook.com/tr), pero el nombre del evento viajaba en un cuerpo que no se pudo leer: no se puede afirmar QUÉ eventos dispara, solo que dispara.';
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
