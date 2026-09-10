# Despliegue

## Entornos recomendados

| Entorno    | Supabase                        | Stripe                      | URL                        |
| ---------- | ------------------------------- | --------------------------- | -------------------------- |
| Local      | `supabase start` (Docker)       | Modo test + `stripe listen` | `http://localhost:3000`    |
| Preview    | Proyecto Supabase de staging    | Modo test                   | URL de preview del hosting |
| Producción | Proyecto Supabase de producción | **Modo live**               | Dominio propio             |

Nunca compartas el mismo proyecto de Supabase entre staging y producción: un
`db reset` en staging borraría datos reales.

## Variables de entorno

Todas las de `.env.example`. En el panel del hosting márcalas como secretas —
salvo las `NEXT_PUBLIC_*`, que por definición se incrustan en el bundle.

`NEXT_PUBLIC_SITE_URL` debe coincidir **exactamente** con el dominio servido: de
ella dependen las `success_url`/`cancel_url` de Stripe y el `emailRedirectTo` del
magic link.

## Vercel

1. Importa el repositorio (Next.js se detecta solo).
2. Añade las variables de entorno.
3. Deploy.

## Netlify

Con `@netlify/plugin-nextjs`:

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Checklist de salida a producción

**Base de datos**

- [ ] Migraciones aplicadas (`supabase db push`)
- [ ] RLS activo en todas las tablas (lo verifica el Security Advisor de Supabase)
- [ ] Backups automáticos habilitados

**Auth**

- [ ] Site URL y Redirect URLs configuradas con el dominio real
- [ ] Plantilla del email de magic link personalizada con tu marca
- [ ] SMTP propio configurado (el de Supabase tiene límites bajos)

**Stripe**

- [ ] Claves **live** en el entorno de producción
- [ ] Endpoint de webhook apuntando al dominio real, con su propio `whsec_`
- [ ] `stripe_price_id` de todos los paquetes y planes apuntando a precios _live_
- [ ] Billing Portal activado en Settings → Billing → Customer portal

**Legal**

- [ ] Textos de `/legal/*` revisados por asesoría legal
- [ ] Política de reembolsos coherente con `GUARANTEE_DAYS` en `src/config/site.ts`

**Verificación end-to-end en producción**

- [ ] Compra real de bajo importe → acceso concedido
- [ ] Reembolso de esa compra → acceso revocado

## Content Security Policy

`next.config.ts` incluye cabeceras de seguridad pero **no** una CSP estricta,
porque el reproductor se embebe en iframe. Cuando fijes los dominios definitivos,
añádela:

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://*.b-cdn.net https://*.supabase.co;
frame-src https://iframe.mediadelivery.net;
connect-src 'self' https://*.supabase.co https://api.stripe.com;
```

## Observabilidad

`src/lib/logger.ts` emite JSON en producción y **redacta** cualquier clave cuyo
nombre contenga `secret`, `token`, `key`, `password`, `authorization` o
`signature`, de modo que un log nunca filtre credenciales.

Alertas mínimas que conviene configurar:

- Fallos del webhook de Stripe (visibles en Developers → Webhooks).
- Respuestas 5xx en `/api/webhooks/stripe`: cada una es una compra sin acceso
  concedido hasta que Stripe reintente.
