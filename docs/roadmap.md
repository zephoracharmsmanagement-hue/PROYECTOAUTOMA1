# Roadmap

## Fase 0 — Base técnica ✅

- [x] Estructura del repositorio y documentación
- [x] Esquema de base de datos con RLS y funciones de acceso
- [x] Autenticación por magic link
- [x] Landing, catálogo y ficha de venta
- [x] Stripe Checkout: pago único y suscripción
- [x] Webhook idempotente que concede y revoca acceso
- [x] Área de miembros con reproductor de video firmado
- [x] Progreso por lección y portal de facturación
- [x] Panel de administración: catálogo, temario, planes, ventas, alumnos y leads

## Fase 1 — Lanzamiento

- [ ] Contenido real: grabar y subir los videos de los tres paquetes
- [ ] Precios reales enlazados a Stripe _live_
- [ ] Textos legales revisados
- [ ] Email transaccional de bienvenida tras la compra (Resend)
- [ ] Analítica de conversión (Plausible o GA4) con eventos de checkout
- [ ] SEO: `sitemap.xml`, `robots.txt`, datos estructurados de producto
- [ ] Testimonios y casos reales en la ficha de venta

## Fase 2 — Conversión ✅

- [x] Order bumps (segunda línea en el mismo pago) y upsell post-compra
- [x] Campañas con código promocional de Stripe aplicado automáticamente y
      barra de anuncio con ventana de fechas
- [x] Recuperación de carritos abandonados vía `checkout.session.expired`
- [x] Motor de experimentos A/B con reparto determinista, aplicado al hero de la
      portada y segmentando todo el embudo de analítica
- [x] Certificados de finalización con verificación pública

Decisión tomada sobre el A/B de precio: se implementa el motor, pero se
recomienda el test **secuencial** (mismo precio para todos durante un periodo) en
lugar del simultáneo entre usuarios, que obliga a informar del precio
personalizado según la Directiva UE 2019/2161. Ver `docs/conversion.md`.

## Fase 3 — Retención y operación

- [ ] Comunidad o Q&A para miembros All Access
- [ ] Recuperación de pagos fallidos (dunning) con avisos propios
- [ ] Métricas de negocio: MRR, churn, LTV, conversión por paquete
- [ ] Programa de afiliados

## Fase 4 — Producto

- [ ] Rutas de aprendizaje que encadenen varios paquetes
- [ ] Automatizaciones instalables en un clic (n8n / Make)
- [ ] Asistente con IA sobre el contenido de los paquetes (RAG)
- [ ] Versión en inglés
