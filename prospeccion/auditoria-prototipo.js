/* Auditoría de una tienda prospecto, en móvil y sin tocar nada.
 *
 * Mide SOLO lo que puede demostrar. Cada hallazgo se guarda con la evidencia
 * que lo sostiene, porque esto termina en un video que se le manda a un
 * desconocido: una afirmación falsa ahí es peor que no mandar nada.
 *
 * Lo que más importa es el pixel. Si alguien lleva meses pagando anuncios y su
 * pixel no reporta AddToCart ni Purchase, Meta no puede optimizar y está
 * gastando a ciegas. Por eso `connect.facebook.net` tiene que estar permitido
 * en la red: si se bloquea, fbq no se inicializa y la tienda parecería no
 * tener pixel cuando sí lo tiene. El campo `fiable` de abajo deja constancia.
 *
 * Uso: node auditoria.js dominio1 dominio2 ...
 */
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');

const SALIDA = path.join(__dirname, 'fichas');
fs.mkdirSync(SALIDA, { recursive: true });
const espera = ms => new Promise(r => setTimeout(r, ms));

async function auditar(ctx, dominio) {
  const page = await ctx.newPage();
  const f = {
    dominio, fecha: new Date().toISOString().slice(0, 10),
    pixel: { script: false, ids: [], eventos: [], fiable: null },
    bloqueados: new Set(),
    home: {}, producto: {}, notas: [],
  };

  page.on('request', r => {
    const u = r.url();
    if (/connect\.facebook\.net\/.*\/fbevents\.js/.test(u)) f.pixel.script = true;
    const tr = u.match(/facebook\.com\/tr\/?\?(.*)$/);
    if (tr) {
      const p = new URLSearchParams(tr[1]);
      const ev = p.get('ev'), id = p.get('id');
      if (id && !f.pixel.ids.includes(id)) f.pixel.ids.push(id);
      if (ev && !f.pixel.eventos.includes(ev)) f.pixel.eventos.push(ev);
    }
  });
  page.on('requestfailed', r => {
    try { f.bloqueados.add(new URL(r.url()).hostname); } catch {}
  });

  const t0 = Date.now();
  let resp = null;
  try {
    resp = await page.goto('https://' + dominio, { waitUntil: 'domcontentloaded', timeout: 45000 });
  } catch (e) {
    f.error = e.message.split('\n')[0];
    await page.close();
    f.bloqueados = [...f.bloqueados];
    return f;
  }
  f.home.estado = resp && resp.status();
  f.home.ttdom = Date.now() - t0;
  await espera(6000); // que corran los scripts y dispare el pixel

  f.home.titulo = (await page.title().catch(() => '')).slice(0, 90);
  f.home.plataforma = await page.evaluate(() => {
    if (window.Shopify) return 'Shopify';
    if (window.LS || document.querySelector('[data-store]')) return 'Tiendanube';
    if (document.querySelector('link[href*="wp-content"],script[src*="wp-content"]')) return 'WordPress/Woo';
    if (document.querySelector('script[src*="vtex"]')) return 'VTEX';
    return null;
  }).catch(() => null);

  /* WhatsApp: el botón que debería existir y casi siempre está, pero vacío
     por detrás. Que exista no prueba que alguien conteste: eso se verifica a
     mano, no aquí, y por eso solo se anota si lo hay. */
  f.home.whatsapp = await page.evaluate(() =>
    !!document.querySelector('a[href*="wa.me"],a[href*="api.whatsapp"],a[href*="whatsapp.com/send"]')
  ).catch(() => false);

  /* Peso real de la portada en móvil. */
  f.home.kb = await page.evaluate(() => {
    try {
      return Math.round(performance.getEntriesByType('resource')
        .reduce((n, r) => n + (r.transferSize || 0), 0) / 1024);
    } catch { return null; }
  }).catch(() => null);

  f.home.imagenes = await page.locator('img').count().catch(() => null);

  /* Una ficha de producto: es donde se decide la venta. */
  const enlace = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[href]')]
      .map(x => x.getAttribute('href'))
      .filter(h => h && /\/(products?|producto|p)\//i.test(h));
    return a[0] || null;
  }).catch(() => null);

  if (enlace) {
    const url = enlace.startsWith('http') ? enlace : 'https://' + dominio + (enlace.startsWith('/') ? '' : '/') + enlace;
    const t1 = Date.now();
    try {
      const r2 = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await espera(6000);
      f.producto.url = url.slice(0, 120);
      f.producto.estado = r2 && r2.status();
      f.producto.ttdom = Date.now() - t1;
      f.producto.resenas = await page.evaluate(() =>
        /rese(ñ|n)a|opinion|review|valoracion|★|⭐/i.test(document.body.innerText.slice(0, 20000))
      ).catch(() => false);
      const texto = await page.evaluate(() => document.body.innerText.slice(0, 20000)).catch(() => '');
      f.producto.contraentrega = /contra\s?entrega|contraentrega|pago al recibir|pagas al recibir/i.test(texto);
      f.producto.cuotas = /addi|sistecr|cuotas sin inter|3 cuotas/i.test(texto);
    } catch (e) { f.producto.error = e.message.split('\n')[0]; }
  } else {
    f.notas.push('no se encontró enlace a una ficha de producto desde la portada');
  }

  /* El veredicto del pixel solo vale si su script pudo cargarse. */
  f.pixel.fiable = f.pixel.script || !f.bloqueados.has('connect.facebook.net');
  f.bloqueados = [...f.bloqueados];
  await page.close();
  return f;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ ...devices['Pixel 7'], locale: 'es-CO' });
  const todas = [];
  for (const d of process.argv.slice(2)) {
    process.stdout.write(d.padEnd(30));
    const f = await auditar(ctx, d);
    todas.push(f);
    const px = !f.pixel.fiable ? 'pixel?' : f.pixel.eventos.length ? f.pixel.eventos.join('+') : 'SIN PIXEL';
    console.log(`${String(f.home.estado || f.error || '-').padEnd(6)} ${String(f.home.ttdom || '-').padEnd(7)} ${String(f.home.plataforma || '-').padEnd(13)} ${px}`);
    fs.writeFileSync(path.join(SALIDA, d.replace(/\W+/g, '_') + '.json'), JSON.stringify(f, null, 1));
  }
  fs.writeFileSync(path.join(SALIDA, '_todas.json'), JSON.stringify(todas, null, 1));
  await browser.close();
})();
