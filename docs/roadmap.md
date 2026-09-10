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

## Fase 3 — Retención y operación ✅

- [x] Q&A para miembros por paquete y lección, con respuestas destacadas del
      equipo y moderación
- [x] Dunning propio con avisos escalados por número de intento, periodo de
      gracia y aviso dentro de la aplicación
- [x] Métricas de negocio: MRR, ARR, churn, ARPU, LTV y embudo por paquete, con
      aviso de muestra insuficiente
- [x] Programa de afiliados con atribución a 90 días, comisión también sobre
      renovaciones y liquidación manual

Requiere suscribir dos eventos nuevos en Stripe: `invoice.paid` y
`checkout.session.expired`. Ver `docs/payments.md`.

## Fase 4 — Producto (en curso)

- [x] Rutas de aprendizaje que encadenan varios paquetes y se venden como lote
- [x] Automatizaciones instalables (n8n / Make / Zapier) servidas solo a quien
      tiene acceso, con detección de credenciales al subirlas
- [ ] Asistente con IA sobre el contenido de los paquetes (RAG)
- [ ] Versión en inglés

Ver `docs/product.md`.

## Fase 5 — Fiabilidad

Pendiente y recomendada antes de abrir ventas: nada de lo construido se ha
ejecutado todavía contra una base de datos real.

- [ ] Tests de integración contra Supabase local: RLS, entitlements, webhook
- [ ] Pruebas del flujo de pago con Stripe en modo test, incluidos bumps,
      reembolsos y carritos abandonados
- [ ] Semilla de datos de demostración coherente para desarrollo
