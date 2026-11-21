/**
 * Captura de páginas de la competencia (solo lectura).
 * - Un solo proceso, secuencial. Escribe cada ficha apenas termina el sitio.
 * - Si ficha.json ya existe, salta ese URL (permite relanzar).
 * - Commit + push cada 4 sitios.
 * Uso: node competencia/scripts/capturar.js
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'competencia', 'paginas');
const LOG = path.join(ROOT, 'competencia', 'scripts', 'captura.log');
const BRANCH = 'claude/competencia-paginas';

const SITES = [
  { id: 'zeroazul', urls: ['https://zeroazul.com/', 'https://zeroazul.com/agencia-shopify'] },
  { id: 'wasy', urls: ['https://wasy.ai/'] },
  { id: 'chateapro', urls: ['https://chateapro.com/', 'https://dropi.co/chatea-pro'] },
  { id: 'talkyria', urls: ['https://talkyria.com/'] },
  { id: 'boteromedia', resolve: 'botero', urls: ['https://www.shopify.com/partners/directory/partner/botero-media1'] },
  { id: 'ventools', urls: ['https://ventools.io/', 'https://ventools.io/agente-ia/ecommerce'] },
  { id: 'ventivaia', urls: ['https://ventivaia.com/'] },
  { id: 'cartiadigital', urls: ['https://cartiadigital.com/pages/shopify-colombia'] },
  { id: 'lumy', urls: ['https://www.lumy.casa/'] },
  { id: 'limely', urls: ['https://www.limely.co.uk/', 'https://www.limely.co.uk/store-audit'] },
  { id: 'analyzify', urls: ['https://analyzify.com/', 'https://analyzify.com/pricing'] },
  { id: 'lucidbot', urls: ['https://lucidbot.co/'] },
  { id: 'fluxi', urls: ['https://fluxi.co/'] },
  // Referentes mundiales (socios Shopify Plus reconocidos por diseño)
  { id: 'ref-wemakewebsites', urls: ['https://wemakewebsites.com/'] },
  { id: 'ref-swanky', urls: ['https://swankyagency.com/'] },
  { id: 'ref-fuelmade', urls: ['https://fuelmade.com/'] },
];

function log(...a) {
  const line = `[${new Date().toISOString()}] ${a.join(' ')}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}

function folderFor(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, '');
  const p = u.pathname.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9-]+/g, '_');
  return path.join(OUT, p ? `${host}__${p}` : host);
}

const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${label} ${ms}ms`)), ms))]);

async function gotoSafe(page, url) {
  let status = null;
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = resp ? resp.status() : null;
  } catch (e) {
    return { ok: false, error: String(e.message || e).slice(0, 300), status };
  }
  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  return { ok: true, status, finalUrl: page.url() };
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = 700;
    const max = Math.min(document.documentElement.scrollHeight, 30000);
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  }).catch(() => {});
  await page.waitForTimeout(1200);
}

/** Extracción en el DOM (solo lectura). */
function extractInPage() {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  };
  const txt = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const top = (el) => Math.round(el.getBoundingClientRect().top + window.scrollY);
  const meta = (n) =>
    (document.querySelector(`meta[name="${n}"]`) || document.querySelector(`meta[property="${n}"]`))?.content || null;

  // Encabezados
  const headings = [...document.querySelectorAll('h1,h2,h3')]
    .filter(vis)
    .map((h) => ({ nivel: h.tagName.toLowerCase(), texto: txt(h).slice(0, 160), y: top(h) }))
    .filter((h) => h.texto)
    .slice(0, 90);
  const h1s = [...document.querySelectorAll('h1')].map(txt).filter(Boolean).slice(0, 5);

  // Subtítulo del hero: primer párrafo/heading con texto tras el primer H1
  let subtitulo = null;
  const h1 = [...document.querySelectorAll('h1')].find(vis) || null;
  if (h1) {
    const all = [...document.querySelectorAll('p,h2,h3,h4,div,span')];
    const h1Top = top(h1);
    for (const el of all) {
      if (!(h1.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      if (h1.contains(el)) continue;
      if (el.children.length > 2 && el.tagName === 'DIV') continue;
      const t = txt(el);
      if (t.length >= 25 && t.length <= 400 && vis(el) && top(el) - h1Top < 900 && t !== txt(h1)) {
        subtitulo = t;
        break;
      }
    }
  }

  // CTAs
  const ctaRe = /(empez|comienz|agend|prueb|solicit|contact|cotiz|habl|demo|grat|regist|quiero|reserv|descarg|escr[ií]b|whatsapp|diagn|auditor|aplica|inscr|ver plan|planes|precios|cuenta|start|book|get |try|contact|free|audit|quote|sign up|talk|schedule|call|enquir|let'?s|work with|request|join|pricing|install)/i;
  const ctas = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('a,button,[role="button"],input[type="submit"]')) {
    if (!vis(el)) continue;
    const t = (txt(el) || el.value || el.getAttribute('aria-label') || '').slice(0, 90);
    if (!t) continue;
    const cls = (el.className && el.className.toString()) || '';
    const href = el.getAttribute('href') || '';
    const looksBtn = el.tagName !== 'A' || /btn|button|cta/i.test(cls) || /wa\.me|whatsapp|calendly|cal\.com|meetings|hubspot|typeform|#contact|#form/i.test(href);
    if (!(looksBtn || ctaRe.test(t))) continue;
    if (t.length > 70) continue;
    const key = t.toLowerCase() + '|' + href;
    if (seen.has(key)) continue;
    seen.add(key);
    ctas.push({ texto: t, destino: href ? (el.href || href) : '(botón sin enlace / acción JS)', y: top(el) });
  }

  const body = document.body ? document.body.innerText : '';
  const lines = body.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

  // Precios
  const priceRe = /((US\$|USD|COP|\$|€|£)\s?\d{1,3}([.,]\d{3})*([.,]\d{1,2})?\s?(k|mil|millones)?|\d{1,3}([.,]\d{3})*([.,]\d{1,2})?\s?(USD|COP|EUR|GBP|dólares|pesos))/i;
  const precios = [...new Set(lines.filter((l) => priceRe.test(l) && l.length < 220))].slice(0, 40);

  // Confianza
  const confianzaRe = /(reseñ|review|opinion|testimon|calific|estrell|clientes|tiendas|marcas|empresas|negocios|brands|stores|merchants|clients|partner|certific|garant|guarantee|reembolso|money.back|ROAS|\d+\s?%|\d+x\b|facturad|ventas|revenue|pedidos|orders|años|years|trustpilot|google)/i;
  const numRe = /\d/;
  const confianza = [...new Set(lines.filter((l) => confianzaRe.test(l) && numRe.test(l) && l.length < 200))].slice(0, 40);
  const garantias = [...new Set(lines.filter((l) => /(garant|guarantee|reembolso|money.back|sin permanencia|sin contrato|cancela cuando|no lock|cancel anytime)/i.test(l) && l.length < 250))].slice(0, 10);
  const testimoniosEls = document.querySelectorAll('[class*="testimon" i],[class*="review" i],[class*="reseña" i],[id*="testimon" i],blockquote');
  const logoImgs = [...document.querySelectorAll('img,svg')].filter((im) => {
    let n = im, depth = 0;
    while (n && depth < 6) {
      const c = ((n.className && n.className.toString()) || '') + ' ' + (n.id || '');
      if (/logo|client|partner|brand|marquee|trust|cliente|marca/i.test(c)) return true;
      n = n.parentElement; depth++;
    }
    return false;
  });
  const logoAlts = [...new Set(logoImgs.map((i) => i.getAttribute('alt') || '').filter((a) => a && a.length < 60))].slice(0, 40);

  // Contacto
  const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.href);
  const whatsapp = [...new Set(hrefs.filter((h) => /wa\.me|whatsapp\.com|api\.whatsapp/i.test(h)))].slice(0, 5);
  const agenda = [...new Set(hrefs.filter((h) => /calendly|cal\.com|meetings\.hubspot|tidycal|zcal|savvycal|booking|agendar|calendar\.app|leadconnector.*calendar|youcanbook/i.test(h)))].slice(0, 5);
  const iframes = [...document.querySelectorAll('iframe')].map((f) => f.src).filter(Boolean);
  const agendaIframes = iframes.filter((s) => /calendly|cal\.com|meetings|tidycal|leadconnector|msgsndr|booking/i.test(s));
  const mail = [...new Set(hrefs.filter((h) => h.startsWith('mailto:')))].slice(0, 3);
  const tel = [...new Set(hrefs.filter((h) => h.startsWith('tel:')))].slice(0, 3);
  const formularios = [...document.querySelectorAll('form')].map((f) => ({
    accion: f.getAttribute('action') || null,
    visible: vis(f),
    campos: [...f.querySelectorAll('input,select,textarea')]
      .filter((i) => !['hidden', 'submit', 'button'].includes((i.type || '').toLowerCase()))
      .map((i) => {
        const lab = i.id ? document.querySelector(`label[for="${CSS.escape(i.id)}"]`) : null;
        return (lab ? txt(lab) : '') || i.placeholder || i.getAttribute('aria-label') || i.name || i.type;
      })
      .filter(Boolean)
      .slice(0, 15),
  })).filter((f) => f.campos.length).slice(0, 6);
  const html = document.documentElement.outerHTML;
  const chatVendors = {
    Intercom: /intercom/i, Crisp: /crisp\.chat/i, Tawk: /tawk\.to/i, HubSpotChat: /js\.hs-scripts|hubspot.*conversations|usemessages/i,
    Drift: /drift\.com/i, Zendesk: /zdassets|zopim/i, Tidio: /tidio/i, Gorgias: /gorgias/i, Chatwoot: /chatwoot/i,
    LeadConnector: /leadconnectorhq|msgsndr/i, Botmaker: /botmaker/i, WhatsAppWidget: /(elfsight|getbutton|whatsapp-widget|wa-widget|joinchat|click-to-chat)/i,
    Manychat: /manychat/i, Landbot: /landbot/i, Respond: /respond\.io/i,
  };
  const chat = Object.entries(chatVendors).filter(([, re]) => re.test(html)).map(([k]) => k);

  // Gratis
  const gratis = [...new Set(lines.filter((l) => /(gratis|gratuit|free|prueba|trial|sin costo|sin cargo|demo|sin compromiso|no cost|complimentary)/i.test(l) && l.length < 200))].slice(0, 20);

  // Plataforma
  const plat = [];
  const gen = meta('generator');
  if (gen) plat.push('generator: ' + gen);
  if (window.Shopify || /cdn\.shopify\.com/.test(html)) plat.push('Shopify');
  if (/wp-content|wp-includes/.test(html)) plat.push('WordPress');
  if (/elementor/.test(html)) plat.push('Elementor');
  if (document.documentElement.getAttribute('data-wf-page') || /webflow/i.test(html)) plat.push('Webflow');
  if (/framerusercontent|framer\.com\/m\//i.test(html) || /framer/i.test(gen || '')) plat.push('Framer');
  if (/static\.wixstatic|wix\.com/i.test(html)) plat.push('Wix');
  if (window.__NEXT_DATA__ || /\/_next\/static/.test(html)) plat.push('Next.js');
  if (window.__NUXT__ || /\/_nuxt\//.test(html)) plat.push('Nuxt');
  if (/squarespace/i.test(html)) plat.push('Squarespace');
  if (/leadconnectorhq|msgsndr|gohighlevel/i.test(html)) plat.push('GoHighLevel/LeadConnector');
  if (/hs-scripts|hubspot/i.test(html)) plat.push('HubSpot (scripts)');
  if (/astro-island|\/_astro\//.test(html)) plat.push('Astro');
  if (/gatsby/i.test(html)) plat.push('Gatsby');
  if (/vite|\/assets\/index-[\w]+\.js/.test(html)) plat.push('Vite (SPA)');
  if (/lovable/i.test(html)) plat.push('Lovable');
  const trackers = [];
  if (/fbevents\.js|connect\.facebook\.net/.test(html)) trackers.push('Meta Pixel');
  if (/googletagmanager\.com\/gtm/.test(html)) trackers.push('GTM');
  if (/gtag\/js|google-analytics/.test(html)) trackers.push('Google Analytics');
  if (/tiktok.*pixel|analytics\.tiktok/i.test(html)) trackers.push('TikTok Pixel');
  if (/clarity\.ms/.test(html)) trackers.push('Microsoft Clarity');
  if (/hotjar/.test(html)) trackers.push('Hotjar');

  return {
    titulo: document.title,
    metaDescripcion: meta('description') || meta('og:description'),
    idioma: document.documentElement.lang || null,
    h1: h1s,
    subtituloHero: subtitulo,
    ctas: ctas.slice(0, 40),
    encabezados: headings,
    preciosTexto: precios,
    confianza: {
      lineasConCifras: confianza,
      garantias,
      elementosTestimonio: testimoniosEls.length,
      logosDetectados: logoImgs.length,
      altLogos: logoAlts,
    },
    contacto: { whatsapp, agenda: [...new Set([...agenda, ...agendaIframes])], formularios, chatWidgets: chat, email: mail, telefono: tel },
    gratisTexto: gratis,
    plataforma: [...new Set(plat)],
    rastreadores: trackers,
    altoPaginaPx: document.documentElement.scrollHeight,
    textoCompleto: body.slice(0, 20000),
  };
}

async function captureDesktop(browser, url, dir) {
  const res = {};
  // 1) Primera pantalla a 2x
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'es-CO' });
  try {
    const p = await ctx2.newPage();
    const g = await gotoSafe(p, url);
    res.cargaEscritorio = g;
    if (g.ok) await p.screenshot({ path: path.join(dir, 'escritorio.png'), timeout: 30000 });
  } finally {
    await ctx2.close().catch(() => {});
  }
  if (!res.cargaEscritorio.ok) return res;
  // 2) Extracción + página completa a 1x
  const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'es-CO' });
  try {
    const p = await ctx1.newPage();
    await gotoSafe(p, url);
    await autoScroll(p);
    res.datos = await withTimeout(p.evaluate(extractInPage), 30000, 'extract');
    const h = await p.evaluate(() => document.documentElement.scrollHeight).catch(() => 0);
    const maxH = 16000;
    if (h > maxH) {
      await p.screenshot({ path: path.join(dir, 'completa.png'), fullPage: true, clip: { x: 0, y: 0, width: 1440, height: maxH }, timeout: 60000 });
      res.completaRecortada = `página de ${h}px recortada a ${maxH}px`;
    } else {
      await p.screenshot({ path: path.join(dir, 'completa.png'), fullPage: true, timeout: 60000 });
    }
  } catch (e) {
    res.errorEscritorio = String(e.message || e).slice(0, 300);
  } finally {
    await ctx1.close().catch(() => {});
  }
  return res;
}

async function captureMobile(browser, url, dir) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], locale: 'es-CO' });
  const out = {};
  try {
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    let bytes = 0, reqs = 0;
    cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength || 0; reqs++; });
    const t0 = Date.now();
    const g = await gotoSafe(p, url);
    out.carga = g;
    if (!g.ok) return out;
    await p.waitForTimeout(3000); // margen para scripts diferidos
    const nav = await p.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      return n ? { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), ttfb: Math.round(n.responseStart) } : null;
    }).catch(() => null);
    out.pesoTransferidoKB = Math.round(bytes / 1024);
    out.pesoTransferidoMB = +(bytes / 1048576).toFixed(2);
    out.solicitudes = reqs;
    out.domContentLoadedMs = nav?.dcl ?? null;
    out.loadMs = nav?.load ?? null;
    out.ttfbMs = nav?.ttfb ?? null;
    out.medidoTrasMs = Date.now() - t0;
    out.nota = 'Medido con caché desactivada, red del contenedor (sin throttling), hasta load + ~5,5 s. Peso = encodedDataLength (bytes por la red).';
    await p.screenshot({ path: path.join(dir, 'movil.png'), timeout: 30000 });
  } catch (e) {
    out.error = String(e.message || e).slice(0, 300);
  } finally {
    await ctx.close().catch(() => {});
  }
  return out;
}

async function processUrl(browser, site, url, extra = {}) {
  const dir = folderFor(url);
  const fichaPath = path.join(dir, 'ficha.json');
  if (fs.existsSync(fichaPath)) { log('SALTO (ya existe)', url); return JSON.parse(fs.readFileSync(fichaPath, 'utf8')); }
  fs.mkdirSync(dir, { recursive: true });
  log('INICIO', url);
  const ficha = { sitio: site.id, url, capturadoEn: new Date().toISOString(), ...extra };
  try {
    const d = await withTimeout(captureDesktop(browser, url, dir), 200000, 'desktop');
    ficha.cargaEscritorio = d.cargaEscritorio;
    if (d.completaRecortada) ficha.completaRecortada = d.completaRecortada;
    if (d.errorEscritorio) ficha.errorEscritorio = d.errorEscritorio;
    if (d.datos) {
      const { textoCompleto, ...rest } = d.datos;
      Object.assign(ficha, rest);
      fs.writeFileSync(path.join(dir, 'texto.txt'), textoCompleto || '');
    }
  } catch (e) {
    ficha.errorEscritorio = String(e.message || e).slice(0, 300);
  }
  try {
    ficha.rendimientoMovil = await withTimeout(captureMobile(browser, url, dir), 120000, 'mobile');
  } catch (e) {
    ficha.rendimientoMovil = { error: String(e.message || e).slice(0, 300) };
  }
  ficha.cargo = !!(ficha.cargaEscritorio && ficha.cargaEscritorio.ok);
  fs.writeFileSync(fichaPath, JSON.stringify(ficha, null, 2));
  log('FIN', url, ficha.cargo ? 'OK' : 'NO CARGÓ', ficha.rendimientoMovil?.pesoTransferidoMB ?? '-', 'MB');
  return ficha;
}

/** BoteroMedia: busca la web propia en la ficha del directorio de Shopify. */
async function resolveBotero(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-CO' });
  try {
    const p = await ctx.newPage();
    const g = await gotoSafe(p, 'https://www.shopify.com/partners/directory/partner/botero-media1');
    if (!g.ok) return null;
    const links = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => ({ h: a.href, t: (a.innerText || '').trim() })));
    const ext = links.filter((l) => /^https?:/.test(l.h) && !/shopify\.|shopifycdn|myshopify|facebook|instagram|linkedin|twitter|x\.com|youtube|tiktok|apple\.com|google\./i.test(l.h));
    log('Botero enlaces externos:', JSON.stringify(ext.slice(0, 10)));
    const site = ext.find((l) => /botero/i.test(l.h)) || ext[0];
    return site ? site.h : null;
  } catch (e) {
    log('Botero error', e.message);
    return null;
  } finally {
    await ctx.close().catch(() => {});
  }
}

function gitCheckpoint(msg) {
  try {
    execSync('git add competencia', { cwd: ROOT, stdio: 'pipe' });
    const st = execSync('git status --porcelain competencia', { cwd: ROOT }).toString().trim();
    if (!st) return;
    execSync(`git commit -q -m "${msg}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_013fvfJPJzU9mK38WeGfk5CB"`, { cwd: ROOT, stdio: 'pipe' });
    for (let i = 0; i < 4; i++) {
      try { execSync(`git push -q -u origin ${BRANCH}`, { cwd: ROOT, stdio: 'pipe', timeout: 90000 }); log('PUSH OK', msg); return; }
      catch (e) { log('push falló, reintento', i + 1, String(e.message).slice(0, 200)); execSync(`sleep ${2 ** (i + 1)}`); }
    }
  } catch (e) {
    log('git checkpoint error', String(e.message).slice(0, 300));
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let browser = await chromium.launch();
  let done = 0;
  for (const site of SITES) {
    let urls = [...site.urls];
    if (site.resolve === 'botero') {
      const marker = path.join(OUT, '_botero_web.json');
      let web = fs.existsSync(marker) ? JSON.parse(fs.readFileSync(marker, 'utf8')).web : undefined;
      if (web === undefined) { web = await resolveBotero(browser); fs.writeFileSync(marker, JSON.stringify({ web }, null, 2)); }
      log('Botero web propia:', web);
      if (web) urls = [web, ...urls];
    }
    for (const url of urls) {
      if (!browser.isConnected()) { log('navegador caído, relanzo'); browser = await chromium.launch(); }
      try { await processUrl(browser, site, url); }
      catch (e) { log('ERROR no controlado', url, e.message); }
    }
    done++;
    if (done % 4 === 0) gitCheckpoint(`competencia: capturas ${done}/${SITES.length} sitios`);
  }
  await browser.close().catch(() => {});
  gitCheckpoint(`competencia: capturas completas (${SITES.length} sitios)`);
  log('TERMINADO');
})();
