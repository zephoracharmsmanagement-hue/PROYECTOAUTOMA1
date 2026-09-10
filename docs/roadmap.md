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

## Fase 1 — Lanzamiento

- [ ] Contenido real: grabar y subir los videos de los tres paquetes
- [ ] Precios reales enlazados a Stripe _live_
- [ ] Textos legales revisados
- [ ] Email transaccional de bienvenida tras la compra (Resend)
- [ ] Analítica de conversión (Plausible o GA4) con eventos de checkout
- [ ] SEO: `sitemap.xml`, `robots.txt`, datos estructurados de producto
- [ ] Testimonios y casos reales en la ficha de venta

## Fase 2 — Conversión

- [ ] Order bumps y upsell post-compra
- [ ] Cupones y campañas de lanzamiento (Stripe promotion codes)
- [ ] Secuencia de email para carritos abandonados
- [ ] Pruebas A/B de titular y precio en la landing
- [ ] Certificados de finalización de paquete

## Fase 3 — Retención y operación

- [ ] Panel de administración para publicar paquetes sin tocar SQL
- [ ] Comunidad o Q&A para miembros All Access
- [ ] Recuperación de pagos fallidos (dunning) con avisos propios
- [ ] Métricas de negocio: MRR, churn, LTV, conversión por paquete
- [ ] Programa de afiliados

## Fase 4 — Producto

- [ ] Rutas de aprendizaje que encadenen varios paquetes
- [ ] Automatizaciones instalables en un clic (n8n / Make)
- [ ] Asistente con IA sobre el contenido de los paquetes (RAG)
- [ ] Versión en inglés
