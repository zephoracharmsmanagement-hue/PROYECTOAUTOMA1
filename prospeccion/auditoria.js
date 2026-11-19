#!/usr/bin/env node
/**
 * auditoria.js — Auditoría de conversión en móvil de tiendas colombianas.
 *
 * CONTEXTO: estas tiendas son prospectos comerciales. Llevan meses pagando
 * anuncios activos en Meta y tienen tienda propia. El objetivo es reunir
 * evidencia MEDIDA de fallos de conversión para un video corto de prospección.
 *
 * REGLA QUE GOBIERNA TODO EL SCRIPT: solo se reporta lo que se puede demostrar.
 * El resultado se le manda a un desconocido; una afirmación falsa quema el
 * prospecto. Por eso el script:
 *   - separa lo OBSERVADO (un evento de pixel que de verdad salió por la red)
 *     de lo DECLARADO (un ID que aparece en el HTML pero que no disparó nada);
 *   - registra en `bloqueados` todo host cuya petición falló, y calcula
 *     `pixel.fiable` a partir de eso, en vez de asumir que la red funcionó;
 *   - guarda la `evidencia` textual de cada hallazgo blando (reseñas,
 *     contraentrega, cuotas) para poder releerla antes de afirmarla.
 *
 * NO TOCA NI ENVÍA NADA: no añade al carrito, no envía formularios, no se
 * registra. El único clic que da es aceptar un banner de cookies, y solo
 * porque un banner que bloquea scripts impediría que el pixel se inicialice
 * y nos haría reportar «sin pixel» en una tienda que sí lo tiene.
 *
 * Escribe cada ficha a disco EN CUANTO la termina y se salta las tiendas que
 * ya tengan ficha con estado "ok", para poder relanzarlo sin perder trabajo.
 *
 * Uso:  node prospeccion/auditoria.js            (todas las pendientes)
 *       node prospeccion/auditoria.js dominio…   (solo esos dominios)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

const RAIZ = __dirname;
const DIR_FICHAS = path.join(RAIZ, 'fichas');
const DIR_CAPTURAS = path.join(RAIZ, 'capturas');

/** Segundos de reposo tras cargar. El pixel de Meta y los scripts de reseñas
 *  suelen inyectarse después de DOMContentLoaded; medir antes daría falsos
 *  negativos. 6 s es el margen acordado. */
const REPOSO_MS = 6000;

/** Tope de navegación. Varias de estas tiendas son lentas de verdad; 45 s
 *  distingue «lenta» de «caída» sin colgar la corrida. */
const TOPE_NAV_MS = 45000;

/** Alto máximo de captura en px CSS. A 2x una página de 3000 px CSS sale de
 *  6000 px de alto: suficiente para ver el hero y las primeras secciones
 *  (donde se pierde la conversión) sin generar PNG inmanejables para el video. */
const TOPE_CAPTURA_CSS = 3000;

/** deviceScaleFactor 2 pedido explícitamente para que las capturas aguanten
 *  el video que se graba encima. Pixel 7 trae 2.625 de fábrica; lo bajamos a 2
 *  a propósito, así que las capturas miden 824 px de ancho. */
const ESCALA_CAPTURA = 2;

/**
 * Antigüedad del anuncio activo más antiguo y número de versiones de anuncio,
 * medidas el 2026-11-19. Es señal de GASTO SOSTENIDO, no de campaña continua:
 * son días desde que se publicó el anuncio activo más viejo, no días seguidos
 * de campaña. Se copia a la ficha solo como contexto comercial.
 */
const ANUNCIOS = {
  'sacriusshop.store': { dias: 365, versiones: 90 },
  'shop-rebel.co': { dias: 1163, versiones: 25 },
  'chicsmovile.com': { dias: 440, versiones: 41 },
  'tiendamultimarca.com.co': { dias: 872, versiones: 18 },
  'lotengotienda.com': { dias: 356, versiones: 41 },
  'tienda-del-valle.com': { dias: 796, versiones: 18 },
  'blasus.co': { dias: 495, versiones: 27 },
  'savatienda.com': { dias: 393, versiones: 31 },
  'lummia.com.co': { dias: 351, versiones: 27 },
  'fantasiasnewyork.com': { dias: 201, versiones: 45 },
  'sowicolombia.myshopify.com': { dias: 285, versiones: 30 },
  'viveshop.website': { dias: 160, versiones: 49 },
  'pintatienda.com': { dias: 387, versiones: 20 },
  'c6ac4e.myshopify.com': { dias: 562, versiones: 12 },
  'safeforyourdreamss.com': { dias: 498, versiones: 13 },
  'bestcool.online': { dias: 207, versiones: 26 },
  'colchonesspring.com.co': { dias: 463, versiones: 11 },
  'nesimu.com': { dias: 363, versiones: 14 },
  'muchi.funnelish.com': { dias: 707, versiones: 7 },
  'karamelovirtual.com': { dias: 407, versiones: 12 },
};

const DOMINIOS = Object.keys(ANUNCIOS);

/** Hosts cuya caída invalidaría la medición del pixel. Si alguna petición a
 *  uno de estos falla, el pixel NO puede inicializarse y la tienda parecería
 *  no tenerlo aunque lo tenga: por eso marcan `pixel.fiable = false`. */
const HOSTS_CRITICOS = [
  'connect.facebook.net',
  'www.googletagmanager.com',
  'googletagmanager.com',
  'facebook.com',
  'facebook.net',
  'fbcdn.net',
];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

function hostDe(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

/**
 * Clasifica POR QUÉ falló una petición. Es la distinción que decide si una
 * medición es fiable:
 *   - 'red del entorno': fallo NUESTRO (DNS, túnel, conexión, timeout). Si le
 *     pasa a un host crítico, no podemos concluir nada sobre el pixel.
 *   - 'politica del sitio o del navegador': el CSP de la propia tienda o el
 *     bloqueo de respuestas opacas de Chromium. Eso le pasa igual a cualquier
 *     visitante real, así que la medición SÍ refleja la realidad.
 */
function clasificarBloqueo(motivo) {
  const m = String(motivo || '');
  if (/^csp$/i.test(m) || /BLOCKED_BY_RESPONSE|BLOCKED_BY_ORB|BLOCKED_BY_CLIENT|BLOCKED_BY_CSP/i.test(m)) {
    return 'politica del sitio o del navegador';
  }
  if (/ERR_ABORTED/i.test(m)) return 'navegacion abortada (no concluyente)';
  return 'red del entorno';
}

function esCritico(host) {
  if (!host) return false;
  return HOSTS_CRITICOS.some((h) => host === h || host.endsWith('.' + h) || host.includes(h));
}

// ---------------------------------------------------------------------------
// Detección de plataforma
//
// POR QUÉ: la plataforma condiciona qué se puede arreglar y cómo se cotiza.
// Un tema de Shopify se optimiza distinto a un funnel de Funnelish o a un
// WooCommerce. Se guardan las SEÑALES que dispararon la detección para que
// la afirmación sea verificable y no un adivinazo.
// ---------------------------------------------------------------------------

const SENALES_PLATAFORMA = [
  ['Shopify', [/cdn\.shopify\.com/i, /\/cdn\/shop\//i, /Shopify\.theme/i, /myshopify\.com/i, /shopify-features/i]],
  ['Funnelish', [/funnelish\.com/i, /funnelish/i]],
  ['Tiendanube', [/tiendanube\.com/i, /nuvemshop/i, /d2r9epyceweg5n\.cloudfront\.net/i, /LS\.store/i]],
  ['WooCommerce', [/woocommerce/i, /wp-content\/plugins\/woocommerce/i, /wc-ajax/i]],
  ['WordPress (sin WooCommerce detectado)', [/wp-content/i, /wp-includes/i]],
  ['VTEX', [/vtexassets\.com/i, /vtexcommercestable/i, /vtex\.com/i]],
  ['Wix', [/parastorage\.com/i, /wix\.com/i, /wixstatic/i]],
  ['Empretienda', [/empretienda/i]],
  ['Jumpseller', [/jumpseller/i]],
  ['PrestaShop', [/prestashop/i]],
  ['Magento', [/magento/i, /mage\/cookies/i]],
  ['Shopify Hydrogen / headless', [/hydrogen/i]],
  ['GemPages / constructor de landings', [/gempages/i]],
  ['Dropi', [/dropi\.co/i]],
];

function detectarPlataforma(html, hosts) {
  const corpus = html + '\n' + hosts.join('\n');
  const encontradas = [];
  for (const [nombre, patrones] of SENALES_PLATAFORMA) {
    const senales = patrones.filter((p) => p.test(corpus)).map((p) => String(p));
    if (senales.length) encontradas.push({ plataforma: nombre, senales });
  }
  // El primero de la lista que haya coincidido gana: la lista está ordenada de
  // la señal más específica (Shopify, Funnelish) a la más genérica (WordPress).
  if (!encontradas.length) return { plataforma: 'no identificada', senales: [], otras: [] };
  return {
    plataforma: encontradas[0].plataforma,
    senales: encontradas[0].senales,
    otras: encontradas.slice(1).map((e) => e.plataforma),
  };
}

// ---------------------------------------------------------------------------
// Banner de cookies
//
// POR QUÉ: un banner de consentimiento que bloquea scripts hasta que lo
// aceptas impide que `fbevents.js` se ejecute. Sin aceptarlo reportaríamos
// «sin evento de pixel» en tiendas que sí lo tienen. Se acepta y se anota.
// ---------------------------------------------------------------------------

async function aceptarBannerCookies(page) {
  try {
    return await page.evaluate(() => {
      const ACEPTAR = /^(aceptar|acepto|aceptar todo|aceptar todas|aceptar todas las cookies|aceptar cookies|entendido|lo entiendo|de acuerdo|estoy de acuerdo|permitir todo|permitir todas|allow all|accept all|accept|accept cookies|i accept|got it|ok|continuar|cerrar)$/i;
      const CONTEXTO = /cookie|privacidad|consentimiento|consent|rgpd|gdpr|pol[ií]tica de privacidad/i;

      const visible = (el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return false;
        const s = getComputedStyle(el);
        return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
      };

      const candidatos = Array.from(
        document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]')
      );

      for (const el of candidatos) {
        const txt = (el.innerText || el.value || '').trim();
        if (!txt || txt.length > 40) continue;
        if (!ACEPTAR.test(txt)) continue;
        if (!visible(el)) continue;

        // Exigimos que el banner hable de cookies/privacidad: evita clicar
        // un "Continuar" de checkout o un "Cerrar" de popup promocional.
        let ctx = '';
        let p = el;
        for (let i = 0; i < 6 && p; i++) { ctx += ' ' + (p.innerText || ''); p = p.parentElement; }
        if (!CONTEXTO.test(ctx)) continue;

        el.click();
        return { detectado: true, aceptado: true, texto_boton: txt };
      }
      return { detectado: false, aceptado: false, texto_boton: null };
    });
  } catch (e) {
    return { detectado: false, aceptado: false, texto_boton: null, error: String(e.message || e) };
  }
}

// ---------------------------------------------------------------------------
// Instrumentación de una página
//
// Monta los oyentes ANTES de navegar, para no perder las primeras peticiones
// (que son justo las del pixel).
// ---------------------------------------------------------------------------

async function instrumentar(page) {
  const estado = {
    eventosPixel: [],      // observados en facebook.com/tr → prueba de que el pixel funciona
    hostsVistos: new Set(),
    fallidos: [],          // host + motivo, alimenta `bloqueados`
    fbeventsCargado: false,
    gtmCargado: false,
    bytes: 0,
    bytesPorTipo: {},
    peticiones: 0,
    urls: [],
  };

  // Bytes REALES transferidos (encabezados + cuerpo comprimido) vía CDP.
  // `response.body().length` daría el tamaño descomprimido y exageraría el peso.
  const porId = new Map();
  let cdp = null;
  try {
    cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    cdp.on('Network.responseReceived', (e) => {
      porId.set(e.requestId, e.type || 'Other');
    });
    cdp.on('Network.loadingFinished', (e) => {
      const n = e.encodedDataLength || 0;
      estado.bytes += n;
      const tipo = porId.get(e.requestId) || 'Other';
      estado.bytesPorTipo[tipo] = (estado.bytesPorTipo[tipo] || 0) + n;
    });
  } catch (e) {
    estado.cdpError = String(e.message || e);
  }

  page.on('request', (req) => {
    const url = req.url();
    const host = hostDe(url);
    estado.peticiones++;
    if (host) estado.hostsVistos.add(host);

    // Evento de pixel de navegador: una petición a /tr con ev= es la prueba
    // de que el pixel se inicializó y disparó. Esto es lo único que permite
    // afirmar que el pixel funciona.
    if (/facebook\.com\/tr/i.test(url)) {
      try {
        const u = new URL(url);
        estado.eventosPixel.push({
          id: u.searchParams.get('id'),
          evento: u.searchParams.get('ev'),
          // `cd[content_ids]`/`cd[value]` dicen si el evento lleva datos útiles
          // para optimizar campañas o si va vacío.
          parametros_cd: Array.from(u.searchParams.keys()).filter((k) => k.startsWith('cd[')),
        });
      } catch { /* URL malformada: se ignora, no se inventa */ }
    }
    if (/connect\.facebook\.net\/.*fbevents\.js/i.test(url)) estado.urls.push(url);
  });

  page.on('response', (res) => {
    const url = res.url();
    if (/connect\.facebook\.net\/.*fbevents\.js/i.test(url) && res.status() < 400) {
      estado.fbeventsCargado = true;
    }
    if (/googletagmanager\.com\/(gtm|gtag)/i.test(url) && res.status() < 400) {
      estado.gtmCargado = true;
    }
  });

  page.on('requestfailed', (req) => {
    const host = hostDe(req.url());
    const motivo = (req.failure() && req.failure().errorText) || 'desconocido';
    estado.fallidos.push({
      host,
      url: req.url().slice(0, 300),
      motivo,
      origen: clasificarBloqueo(motivo),
      critico: esCritico(host),
    });
  });

  return { estado, cdp };
}

// ---------------------------------------------------------------------------
// Medición de una página concreta
// ---------------------------------------------------------------------------

async function medirPagina(context, url, nombreCaptura) {
  const page = await context.newPage();
  const { estado } = await instrumentar(page);

  const t0 = Date.now();
  let navError = null;
  let urlFinal = url;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TOPE_NAV_MS });
  } catch (e) {
    navError = String(e.message || e).split('\n')[0];
  }
  const msRelojHastaDom = Date.now() - t0;

  // Banner de cookies ANTES de medir el pixel (ver aceptarBannerCookies).
  await dormir(1500);
  const banner = await aceptarBannerCookies(page);

  // Reposo para que corran los scripts diferidos y dispare el pixel.
  await dormir(REPOSO_MS);

  try { urlFinal = page.url(); } catch { /* se queda la original */ }

  // Tiempos del propio navegador (Navigation Timing). Más honesto que el
  // reloj de pared porque excluye el arranque del contexto de Playwright.
  let tiempos = null;
  try {
    tiempos = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      if (!n) return null;
      return {
        dom: Math.round(n.domContentLoadedEventEnd),
        load: Math.round(n.loadEventEnd),
        respuesta_servidor: Math.round(n.responseStart),
      };
    });
  } catch { /* página muerta: queda null y así se reporta */ }

  // Contenido visible y HTML, para los hallazgos de contenido.
  let html = '';
  let texto = '';
  let imagenes = 0;
  let altoCss = 0;
  try {
    html = await page.content();
    const d = await page.evaluate(() => ({
      texto: document.body ? document.body.innerText : '',
      imagenes: document.querySelectorAll('img').length,
      alto: Math.max(
        document.body ? document.body.scrollHeight : 0,
        document.documentElement ? document.documentElement.scrollHeight : 0
      ),
      titulo: document.title || '',
    }));
    texto = d.texto || '';
    imagenes = d.imagenes;
    altoCss = d.alto;
    estado.titulo = d.titulo;
  } catch (e) {
    estado.errorContenido = String(e.message || e);
  }

  // Captura. Se usa fullPage y, si la página es un monstruo, se recorta a
  // TOPE_CAPTURA_CSS para que el PNG siga sirviendo para el video.
  let captura = { archivo: null, truncada: false, alto_css: altoCss, error: null };
  try {
    const destino = path.join(DIR_CAPTURAS, nombreCaptura);
    if (altoCss > TOPE_CAPTURA_CSS) {
      const vp = page.viewportSize() || { width: 412 };
      try {
        await page.screenshot({
          path: destino, fullPage: true,
          clip: { x: 0, y: 0, width: vp.width, height: TOPE_CAPTURA_CSS },
        });
      } catch {
        await page.screenshot({ path: destino, fullPage: false });
      }
      captura.truncada = true;
    } else {
      await page.screenshot({ path: destino, fullPage: true });
    }
    captura.archivo = path.posix.join('capturas', nombreCaptura);
  } catch (e) {
    captura.error = String(e.message || e).split('\n')[0];
  }

  // Enlaces internos, para encontrar luego la ficha de producto.
  let enlaces = [];
  try {
    enlaces = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]')).map((a) => a.href).slice(0, 600)
    );
  } catch { /* sin enlaces: el buscador de producto usará las rutas de reserva */ }

  await page.close().catch(() => {});

  return {
    url_pedida: url,
    url_final: urlFinal,
    nav_error: navError,
    ms_dom: tiempos ? tiempos.dom : null,
    ms_load: tiempos && tiempos.load ? tiempos.load : null,
    ms_respuesta_servidor: tiempos ? tiempos.respuesta_servidor : null,
    ms_reloj_hasta_dom: msRelojHastaDom,
    kb_transferidos: kb(estado.bytes),
    kb_por_tipo: Object.fromEntries(
      Object.entries(estado.bytesPorTipo).map(([k, v]) => [k, kb(v)])
    ),
    peticiones: estado.peticiones,
    imagenes_en_dom: imagenes,
    banner_cookies: banner,
    captura,
    _interno: { estado, html, texto, enlaces },
  };
}

// ---------------------------------------------------------------------------
// Hallazgos de contenido en la ficha de producto
//
// POR QUÉ cada uno:
//  - Reseñas visibles: su ausencia es la objeción nº1 en venta en frío por
//    anuncios. Es un hallazgo vendible y fácil de demostrar en el video.
//  - Contraentrega: en Colombia es el principal desbloqueador de compra.
//    Si la tienda la ofrece pero no lo dice en la ficha, pierde ventas.
//  - Cuotas (Addi, Sistecrédito): sube el ticket medio; su ausencia es
//    una palanca concreta.
// Se guarda la EVIDENCIA (el fragmento que coincidió) para poder releerla.
// ---------------------------------------------------------------------------

function buscarEvidencia(texto, patron, ventana = 90) {
  const m = patron.exec(texto);
  if (!m) return null;
  const i = Math.max(0, m.index - 25);
  return texto.slice(i, i + ventana).replace(/\s+/g, ' ').trim();
}

async function analizarContenidoProducto(context, urlProducto, resultadoProducto) {
  const texto = resultadoProducto._interno.texto || '';
  const html = resultadoProducto._interno.html || '';

  // Reseñas: exigimos señal en el texto visible O un widget de reseñas
  // reconocido en el HTML. Solo con el widget no basta para decir "visibles",
  // así que se registran por separado.
  const patronTextoResenas = /(\d+\s*(rese(ñ|n)as?|opiniones|valoraciones|reviews?)|rese(ñ|n)as?\b|opiniones de clientes|valoraciones|calificaci(ó|o)n|\b\d[.,]\d\s*(de\s*5|\/\s*5|estrellas)|basado en \d+)/i;
  const evidenciaTexto = buscarEvidencia(texto, patronTextoResenas);

  const WIDGETS = [
    ['Judge.me', /judge\.?me|jdgm/i],
    ['Loox', /loox\.io|loox-/i],
    ['Stamped', /stamped\.io/i],
    ['Yotpo', /yotpo/i],
    ['Okendo', /okendo/i],
    ['Ryviu', /ryviu/i],
    ['Vitals', /vitals\.co|vitals-/i],
    ['Trustpilot', /trustpilot/i],
    ['Ali Reviews', /alireviews|ali-reviews/i],
    ['Rivyo', /rivyo/i],
    ['Opinew', /opinew/i],
    ['WooCommerce nativo', /woocommerce-Reviews|comment-form-rating/i],
    ['Shopify nativo (spr)', /shopify-product-reviews|spr-reviews/i],
  ];
  const widgets = WIDGETS.filter(([, p]) => p.test(html)).map(([n]) => n);

  const patronContraentrega = /(contra\s*-?\s*entrega|contraentrega|pago contra entrega|pagas? (al|cuando) recib|paga al recibir|recibe y paga|pago al recibir)/i;
  const evidenciaContraentrega = buscarEvidencia(texto, patronContraentrega);

  const patronCuotas = /(addi|sistecr[eé]dito|sistecredito|hasta \d+ cuotas|\d+ cuotas|a cuotas|paga a cuotas|cuotas sin inter[eé]s|mercado\s*cr[eé]dito|wompi.*cuotas)/i;
  const evidenciaCuotas = buscarEvidencia(texto, patronCuotas);
  const marcasCuotas = ['Addi', 'Sistecrédito', 'Mercado Crédito']
    .filter((m) => new RegExp(m.replace('é', '[eé]'), 'i').test(texto + ' ' + html));

  return {
    resenas: {
      visibles: Boolean(evidenciaTexto),
      evidencia_texto_visible: evidenciaTexto,
      widgets_detectados_en_html: widgets,
      nota: evidenciaTexto
        ? 'Hay señal de reseñas en el texto visible de la ficha.'
        : (widgets.length
            ? 'Se detectó código de un widget de reseñas pero NO apareció señal de reseñas en el texto visible: puede estar instalado sin reseñas publicadas o cargando tras el reposo de 6 s.'
            : 'No se detectó ninguna señal de reseñas, ni en el texto visible ni en el HTML.'),
    },
    contraentrega: {
      mencionada: Boolean(evidenciaContraentrega),
      evidencia: evidenciaContraentrega,
    },
    cuotas: {
      mencionadas: Boolean(evidenciaCuotas),
      evidencia: evidenciaCuotas,
      marcas: marcasCuotas,
    },
  };
}

// ---------------------------------------------------------------------------
// WhatsApp
//
// POR QUÉ: con tráfico pago frío en Colombia, WhatsApp es el canal que rescata
// al que no compra solo. Su ausencia es un hallazgo vendible e inmediato.
// Se buscan los tres formatos de enlace y se distingue si el enlace es
// VISIBLE en pantalla o solo existe en el HTML.
// ---------------------------------------------------------------------------

const PATRON_WA = /(wa\.me\/|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send|whatsapp\.com\/send|wa\.link\/)/i;

async function detectarWhatsApp(resultados) {
  const encontrados = new Set();
  for (const r of resultados) {
    const html = (r && r._interno && r._interno.html) || '';
    const re = /(https?:\/\/)?(wa\.me\/[^"'\s<>\\]+|wa\.link\/[^"'\s<>\\]+|api\.whatsapp\.com\/send[^"'\s<>\\]*|web\.whatsapp\.com\/send[^"'\s<>\\]*|whatsapp\.com\/send[^"'\s<>\\]*)/gi;
    let m;
    while ((m = re.exec(html)) !== null) encontrados.add(m[0].slice(0, 200));
    for (const href of (r._interno.enlaces || [])) {
      if (PATRON_WA.test(href)) encontrados.add(href.slice(0, 200));
    }
  }
  return Array.from(encontrados).slice(0, 8);
}

// ---------------------------------------------------------------------------
// Localización de la ficha de producto
//
// POR QUÉ importa acertar: la ficha de producto es donde se decide la compra,
// así que medirla mal arruina la mitad de la auditoría. Se puntúan los enlaces
// internos por patrones de URL de producto de cada plataforma y se descartan
// carrito, checkout, blog y páginas legales.
// ---------------------------------------------------------------------------

const PATRONES_PRODUCTO = [
  { re: /\/products\//i, puntos: 100 },   // Shopify
  { re: /\/product\//i, puntos: 95 },     // WooCommerce (inglés)
  { re: /\/producto\//i, puntos: 95 },    // WooCommerce (español)
  { re: /\/productos\/[^/]+$/i, puntos: 90 }, // Tiendanube
  { re: /-p-\d+/i, puntos: 80 },
  { re: /\/p\/[^/]+/i, puntos: 75 },
  { re: /\/[^/]+\/p(\?|$)/i, puntos: 75 }, // VTEX
  { re: /\/item\//i, puntos: 60 },
];

const EXCLUIR_PRODUCTO = /\/(cart|carrito|checkout|cuenta|account|login|register|blog|policies|politicas|pol[ií]tica|pages?\/|paginas?\/|terminos|privacidad|contacto|search|buscar|collections\/?$|categoria|category)/i;

function elegirUrlProducto(enlaces, origen) {
  const vistos = new Set();
  const candidatos = [];
  for (const href of enlaces) {
    let u;
    try { u = new URL(href); } catch { continue; }
    if (u.origin !== origen) continue;              // solo misma tienda
    if (EXCLUIR_PRODUCTO.test(u.pathname)) continue;
    const limpia = u.origin + u.pathname;
    if (vistos.has(limpia)) continue;
    vistos.add(limpia);
    for (const { re, puntos } of PATRONES_PRODUCTO) {
      if (re.test(u.pathname)) { candidatos.push({ url: limpia, puntos }); break; }
    }
  }
  candidatos.sort((a, b) => b.puntos - a.puntos);
  return candidatos.length ? candidatos[0].url : null;
}

// ---------------------------------------------------------------------------
// Veredicto del pixel
//
// Aquí vive la regla más delicada de todo el script.
//
//  - `eventos` solo contiene eventos OBSERVADOS saliendo por la red.
//  - Si no se observó ninguno pero un host crítico falló, NO se puede
//    concluir nada: `fiable = false`.
//  - Si no se observó ninguno y la red estuvo limpia, el hallazgo honesto es
//    «no se detectó ningún evento de pixel en el navegador», NUNCA
//    «no tiene pixel»: la tienda puede estar usando la API de Conversiones
//    server-side, que es legítima y no se ve desde el navegador.
// ---------------------------------------------------------------------------

function veredictoPixel(resultados) {
  const eventos = [];
  const idsDispararon = new Set();
  const fallidosCriticos = [];            // fallo de NUESTRA red -> invalida
  const bloqueosCriticosPorPolitica = [];  // CSP del sitio -> no invalida
  let peticionesTrSinEvento = 0;
  let fbeventsCargado = false;
  let gtmCargado = false;

  for (const r of resultados) {
    const e = r._interno.estado;
    if (e.fbeventsCargado) fbeventsCargado = true;
    if (e.gtmCargado) gtmCargado = true;
    for (const ev of e.eventosPixel) {
      // Solo cuenta como evento si lleva el parametro ev=. Una peticion a /tr
      // sin ev (p. ej. el iframe de respaldo) no es un evento y contarla
      // exageraria el hallazgo.
      if (ev.evento) {
        eventos.push({ pagina: r._etiqueta, id: ev.id, evento: ev.evento, parametros_cd: ev.parametros_cd });
        if (ev.id) idsDispararon.add(ev.id);
      } else {
        peticionesTrSinEvento++;
      }
    }
    for (const f of e.fallidos) {
      if (!f.critico) continue;
      if (f.origen === 'red del entorno') fallidosCriticos.push(f);
      else bloqueosCriticosPorPolitica.push(f);
    }
  }

  // IDs declarados en el HTML: señal de intención, no prueba de que funcione.
  const idsDeclarados = new Set();
  for (const r of resultados) {
    const html = r._interno.html || '';
    const res = [
      /fbq\(\s*['"]init['"]\s*,\s*['"](\d{8,20})['"]/gi,
      /facebook\.com\/tr\?id=(\d{8,20})/gi,
      /["']pixel_?id["']\s*:\s*["']?(\d{8,20})/gi,
      /pixelId["']?\s*[:=]\s*["'](\d{8,20})["']/gi,
    ];
    for (const re of res) {
      let m;
      while ((m = re.exec(html)) !== null) idsDeclarados.add(m[1]);
    }
  }

  const tiposEvento = Array.from(new Set(eventos.map((e) => e.evento).filter(Boolean)));

  let fiable = true;
  let motivo = null;
  if (fallidosCriticos.length) {
    fiable = false;
    motivo = 'Fallaron por red peticiones a hosts necesarios para el pixel ('
      + Array.from(new Set(fallidosCriticos.map((f) => f.host))).join(', ')
      + '): sin ellos el pixel no puede inicializarse, así que la ausencia de eventos no demuestra nada.';
  } else if (!eventos.length && idsDeclarados.size > 0 && !fbeventsCargado) {
    fiable = false;
    motivo = 'El HTML declara un ID de pixel pero fbevents.js no llegó a cargar y no se registró ninguna petición fallida a un host crítico: la medición es ambigua.';
  }

  let lectura;
  if (eventos.length) {
    lectura = `Se observaron ${eventos.length} evento(s) de pixel en el navegador: ${tiposEvento.join(', ')}.`;
  } else if (!fiable) {
    lectura = 'No se puede concluir nada sobre el pixel en esta tienda (ver motivo_no_fiable).';
  } else {
    lectura = 'No se detectó ningún evento de pixel en el navegador. Esto NO prueba que la tienda no tenga pixel: puede estar usando la API de Conversiones server-side, que es legítima y no se ve desde el navegador.';
  }

  return {
    fiable,
    motivo_no_fiable: motivo,
    peticiones_tr_sin_parametro_ev: peticionesTrSinEvento,
    bloqueos_criticos_por_politica_del_sitio: bloqueosCriticosPorPolitica.map((f) => ({ host: f.host, motivo: f.motivo })),
    fbevents_js_cargado: fbeventsCargado,
    google_tag_manager_cargado: gtmCargado,
    eventos_observados: eventos,
    tipos_de_evento: tiposEvento,
    ids_que_dispararon: Array.from(idsDispararon),
    ids_declarados_en_html: Array.from(idsDeclarados),
    lectura,
  };
}

// ---------------------------------------------------------------------------
// Auditoría de una tienda
// ---------------------------------------------------------------------------

async function auditarTienda(browser, dominio) {
  const ficha = {
    dominio,
    estado: 'error',
    medido_el: new Date().toISOString(),
    entorno: {
      dispositivo: 'Pixel 7 (emulado en Chromium)',
      locale: 'es-CO',
      zona_horaria: 'America/Bogota',
      reposo_tras_carga_ms: REPOSO_MS,
      device_scale_factor_capturas: ESCALA_CAPTURA,
      nota: 'Sin estrangulamiento de red ni CPU: los tiempos son de un móvil emulado sobre la red del contenedor, así que comparan bien entre tiendas pero son optimistas frente a un 4G real.',
    },
    anuncios_meta: {
      dias_del_anuncio_activo_mas_antiguo: ANUNCIOS[dominio] ? ANUNCIOS[dominio].dias : null,
      versiones_de_anuncio: ANUNCIOS[dominio] ? ANUNCIOS[dominio].versiones : null,
      medido_el: '2026-11-19',
      advertencia: 'Son días desde la publicación del anuncio activo más antiguo, NO días de campaña continua. Indica gasto sostenido, no continuidad.',
    },
  };

  const context = await browser.newContext({
    ...devices['Pixel 7'],
    deviceScaleFactor: ESCALA_CAPTURA, // pedido explícitamente para el video
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    ignoreHTTPSErrors: false, // un certificado roto es un hallazgo, no algo a tapar
  });

  const resultados = [];

  try {
    // --- Portada. Se prueba con y sin www para no confundir "mal escrito"
    //     con "caída". ---
    let portada = await medirPagina(context, `https://${dominio}`, `${dominio}-portada.png`);
    if (portada.nav_error && !dominio.includes('myshopify') && !dominio.includes('funnelish')) {
      log(`  ${dominio}: portada falló (${portada.nav_error}), reintento con www.`);
      const alt = await medirPagina(context, `https://www.${dominio}`, `${dominio}-portada.png`);
      if (!alt.nav_error) { portada = alt; ficha.nota_dominio = `Respondió en www.${dominio}`; }
    }
    portada._etiqueta = 'portada';
    resultados.push(portada);

    if (portada.nav_error) {
      ficha.error = `No se pudo cargar la portada: ${portada.nav_error}`;
    }

    const origen = (() => { try { return new URL(portada.url_final).origin; } catch { return `https://${dominio}`; } })();

    // --- Plataforma ---
    const hosts = Array.from(portada._interno.estado.hostsVistos || []);
    const plat = detectarPlataforma(portada._interno.html || '', hosts);
    ficha.plataforma = {
      detectada: plat.plataforma,
      senales: plat.senales,
      otras_senales_presentes: plat.otras,
    };

    // --- Ficha de producto ---
    let urlProducto = elegirUrlProducto(portada._interno.enlaces || [], origen);
    let comoSeEncontro = urlProducto ? 'enlace en la portada' : null;

    // Reserva 1: en Shopify, /collections/all casi siempre lista productos.
    if (!urlProducto && /Shopify/i.test(plat.plataforma)) {
      const col = await medirPagina(context, `${origen}/collections/all`, `${dominio}-tmp-coleccion.png`);
      urlProducto = elegirUrlProducto(col._interno.enlaces || [], origen);
      if (urlProducto) comoSeEncontro = 'enlace en /collections/all';
      try { fs.unlinkSync(path.join(DIR_CAPTURAS, `${dominio}-tmp-coleccion.png`)); } catch {}
    }

    let producto;
    if (urlProducto) {
      producto = await medirPagina(context, urlProducto, `${dominio}-producto.png`);
    } else {
      // Reserva 2: funnels de una sola página (Funnelish y similares) no tienen
      // ficha separada: la portada ES la página de venta. Se mide esa y se
      // deja constancia, en vez de inventar una URL.
      comoSeEncontro = 'no se encontró ficha de producto separada; se analiza la portada como página de venta';
      producto = portada;
      try {
        fs.copyFileSync(
          path.join(DIR_CAPTURAS, `${dominio}-portada.png`),
          path.join(DIR_CAPTURAS, `${dominio}-producto.png`)
        );
      } catch {}
    }
    producto._etiqueta = 'producto';
    if (producto !== portada) resultados.push(producto);

    // --- Velocidad y peso ---
    // POR QUÉ: con tráfico pago, cada segundo de espera en móvil se come
    // conversión. El peso en KB explica el porqué del tiempo y da el titular
    // concreto ("3,5 MB en la portada") que funciona en el video.
    ficha.rendimiento = {
      portada: {
        ms_dom: portada.ms_dom,
        ms_load: portada.ms_load,
        ms_respuesta_servidor: portada.ms_respuesta_servidor,
        ms_reloj_hasta_dom: portada.ms_reloj_hasta_dom,
        kb_transferidos: portada.kb_transferidos,
        kb_por_tipo: portada.kb_por_tipo,
        peticiones: portada.peticiones,
        imagenes_en_dom: portada.imagenes_en_dom,
      },
      producto: {
        ms_dom: producto.ms_dom,
        ms_load: producto.ms_load,
        ms_respuesta_servidor: producto.ms_respuesta_servidor,
        ms_reloj_hasta_dom: producto.ms_reloj_hasta_dom,
        kb_transferidos: producto.kb_transferidos,
        kb_por_tipo: producto.kb_por_tipo,
        peticiones: producto.peticiones,
        imagenes_en_dom: producto.imagenes_en_dom,
      },
      nota_metrica: 'ms_dom es domContentLoadedEventEnd de Navigation Timing (el propio navegador). kb_transferidos son bytes reales de red (comprimidos, con encabezados) vía CDP, en un contexto sin caché.',
    };

    ficha.producto = {
      url: producto.url_final,
      como_se_encontro: comoSeEncontro,
      es_la_misma_portada: producto === portada,
      titulo: producto._interno.estado.titulo || null,
      nav_error: producto.nav_error,
      ...(await analizarContenidoProducto(context, urlProducto, producto)),
    };

    // --- Pixel ---
    ficha.pixel = veredictoPixel(resultados);

    // --- WhatsApp ---
    const wa = await detectarWhatsApp(resultados);
    ficha.whatsapp = {
      tiene_enlace: wa.length > 0,
      enlaces: wa,
      lectura: wa.length
        ? 'Hay al menos un enlace de WhatsApp en el HTML de las páginas medidas.'
        : 'No se encontró ningún enlace wa.me, wa.link, api.whatsapp.com ni whatsapp.com/send en el HTML de la portada ni de la ficha de producto.',
    };

    // --- Bloqueados: hosts cuyas peticiones fallaron ---
    // Es el contrapeso honesto de todo el informe: si aquí hay un host crítico,
    // el veredicto del pixel no vale.
    const bloqueados = [];
    const yaVisto = new Set();
    for (const r of resultados) {
      for (const f of r._interno.estado.fallidos) {
        const clave = `${f.host}|${f.motivo}`;
        if (yaVisto.has(clave)) continue;
        yaVisto.add(clave);
        bloqueados.push({ host: f.host, motivo: f.motivo, origen: f.origen, critico_para_el_pixel: f.critico, pagina: r._etiqueta, url: f.url });
      }
    }
    ficha.bloqueados = bloqueados;
    ficha.red_limpia_para_el_pixel = !bloqueados.some(
      (b) => b.critico_para_el_pixel && b.origen === 'red del entorno'
    );

    ficha.banner_cookies = {
      portada: portada.banner_cookies,
      producto: producto.banner_cookies,
    };

    ficha.capturas = {
      portada: portada.captura,
      producto: producto.captura,
      nota: `Capturas a deviceScaleFactor ${ESCALA_CAPTURA} (824 px de ancho). Las páginas de más de ${TOPE_CAPTURA_CSS} px CSS de alto se recortan a esa altura; el campo truncada lo indica.`,
    };

    ficha.hosts_de_terceros = Array.from(
      new Set(resultados.flatMap((r) => Array.from(r._interno.estado.hostsVistos || [])))
    ).filter((h) => !h.includes(dominio.replace(/^www\./, ''))).sort();

    ficha.estado = portada.nav_error ? 'error' : 'ok';
  } catch (e) {
    ficha.estado = 'error';
    ficha.error = String(e.stack || e.message || e).slice(0, 1200);
  } finally {
    await context.close().catch(() => {});
  }

  return ficha;
}

// ---------------------------------------------------------------------------
// Bucle principal
// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(DIR_FICHAS, { recursive: true });
  fs.mkdirSync(DIR_CAPTURAS, { recursive: true });

  const pedidos = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const lista = pedidos.length ? pedidos : DOMINIOS;

  // Se saltan solo las fichas con estado "ok": así un relanzamiento no pierde
  // trabajo bueno pero sí reintenta lo que falló.
  const pendientes = lista.filter((d) => {
    const f = path.join(DIR_FICHAS, `${d}.json`);
    if (!fs.existsSync(f)) return true;
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (j.estado === 'ok') { log(`SALTO ${d}: ya tiene ficha con estado ok.`); return false; }
      return true;
    } catch { return true; }
  });

  log(`Tiendas a auditar: ${pendientes.length} de ${lista.length}.`);
  if (!pendientes.length) { log('Nada pendiente.'); return; }

  const browser = await chromium.launch();
  log(`Chromium arrancado: ${browser.version()}`);

  let i = 0;
  for (const dominio of pendientes) {
    i++;
    log(`[${i}/${pendientes.length}] === ${dominio} ===`);
    const t0 = Date.now();
    let ficha;
    try {
      ficha = await auditarTienda(browser, dominio);
    } catch (e) {
      ficha = { dominio, estado: 'error', medido_el: new Date().toISOString(), error: String(e.stack || e).slice(0, 1200) };
    }

    // Se escribe en cuanto termina, no al final: si la corrida se corta,
    // lo ya medido no se pierde.
    const destino = path.join(DIR_FICHAS, `${dominio}.json`);
    fs.writeFileSync(destino, JSON.stringify(ficha, null, 2) + '\n', 'utf8');

    const seg = Math.round((Date.now() - t0) / 100) / 10;
    log(`  -> ${ficha.estado.toUpperCase()} en ${seg}s | plataforma=${ficha.plataforma ? ficha.plataforma.detectada : '?'} | pixel=${ficha.pixel ? (ficha.pixel.tipos_de_evento.join('/') || 'sin eventos') : '?'} fiable=${ficha.pixel ? ficha.pixel.fiable : '?'} | portada ${ficha.rendimiento ? ficha.rendimiento.portada.ms_dom + 'ms/' + ficha.rendimiento.portada.kb_transferidos + 'KB' : '?'} | producto ${ficha.rendimiento ? ficha.rendimiento.producto.ms_dom + 'ms/' + ficha.rendimiento.producto.kb_transferidos + 'KB' : '?'} | wa=${ficha.whatsapp ? ficha.whatsapp.tiene_enlace : '?'}${ficha.error ? ' | ERROR: ' + String(ficha.error).slice(0, 160) : ''}`);
  }

  await browser.close().catch(() => {});
  log('Corrida terminada.');
}

main().catch((e) => { console.error('FALLO GENERAL:', e); process.exit(1); });
