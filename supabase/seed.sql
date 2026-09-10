-- =============================================================================
-- SEED - Catalogo de demostracion
-- Los `stripe_price_id_*` son placeholders: reemplazalos por los IDs reales de
-- tu cuenta de Stripe (ver docs/payments.md) antes de cobrar en produccion.
-- =============================================================================

insert into public.plans (slug, name, description, interval, price_cents, stripe_price_id, trial_days, features, sort_order)
values
  ('all-access-mensual', 'All Access Mensual',
   'Acceso a todo el catalogo de paquetes y a cada nuevo lanzamiento.',
   'month', 4900, 'price_REEMPLAZAR_mensual', 7,
   '["Todos los paquetes actuales","Paquetes nuevos incluidos","Plantillas y automatizaciones descargables","Cancela cuando quieras"]'::jsonb, 1),
  ('all-access-anual', 'All Access Anual',
   'Mismo acceso con 2 meses gratis frente al plan mensual.',
   'year', 49000, 'price_REEMPLAZAR_anual', 0,
   '["Todo lo del plan mensual","2 meses gratis","Sesiones de Q&A trimestrales"]'::jsonb, 2)
on conflict (slug) do nothing;

with pkg as (
  insert into public.packages
    (slug, title, subtitle, outcome, description, category, level, features,
     price_one_time_cents, compare_at_price_cents, stripe_price_id_one_time, status, sort_order)
  values
    ('dropshipping-cero-a-venta',
     'Dropshipping de Cero a Primera Venta',
     'Tu primera tienda validada en 14 dias',
     'Lanza una tienda de dropshipping validada y con su primera venta real.',
     'Metodo completo: seleccion de nicho con datos, validacion de producto, montaje de la tienda, proveedores fiables y primera campana de trafico rentable.',
     'dropshipping', 'principiante',
     '[{"title":"Validacion con datos","detail":"Deja de adivinar nichos: criterios medibles de demanda y margen."},
       {"title":"Tienda lista en 48h","detail":"Plantilla de Shopify y checklist de configuracion."},
       {"title":"Proveedores verificados","detail":"Guion de negociacion y filtros anti-estafa."}]'::jsonb,
     14900, 29900, 'price_REEMPLAZAR_dropshipping', 'published', 1),

    ('automatizacion-whatsapp-ventas',
     'Automatizacion de Ventas por WhatsApp',
     'Agente de IA que atiende y cierra 24/7',
     'Instala un agente conversacional que responde, califica y cierra ventas sin ti.',
     'Montaje completo de un agente sobre la API de WhatsApp con IA: base de conocimiento, recuperacion de carritos, seguimiento automatico y traspaso a humano.',
     'automatizacion', 'intermedio',
     '[{"title":"Agente con RAG","detail":"Responde con tu catalogo real, no con alucinaciones."},
       {"title":"Recuperacion de carritos","detail":"Secuencia automatica que rescata ventas perdidas."},
       {"title":"Traspaso a humano","detail":"Escalado limpio cuando el cliente lo pide."}]'::jsonb,
     19900, 39900, 'price_REEMPLAZAR_whatsapp', 'published', 2),

    ('escalado-ads-ecommerce',
     'Escalado con Ads para Ecommerce',
     'De 1.000 a 10.000 USD/mes sin quemar caja',
     'Escala tu tienda con una estructura de campanas que protege el margen.',
     'Estructura de cuenta, creativos que convierten, lectura de metricas que importan y reglas de escalado y corte para no fundir presupuesto.',
     'ecommerce', 'avanzado',
     '[{"title":"Estructura de cuenta","detail":"Campanas ordenadas para leer datos sin ruido."},
       {"title":"Reglas de escalado","detail":"Cuando subir, cuando cortar: umbrales concretos."},
       {"title":"Creativos en serie","detail":"Sistema para producir angulos nuevos cada semana."}]'::jsonb,
     24900, 49900, 'price_REEMPLAZAR_ads', 'published', 3)
  on conflict (slug) do nothing
  returning id, slug
),
mod as (
  insert into public.modules (package_id, title, summary, sort_order)
  select p.id, m.title, m.summary, m.sort_order
  from pkg p
  cross join lateral (
    values
      ('Fundamentos y preparacion', 'Que necesitas antes de vender la primera unidad.', 1),
      ('Implementacion paso a paso', 'Construccion guiada, en pantalla y sin saltos.', 2),
      ('Optimizacion y escalado', 'Que medir y que ajustar para crecer.', 3)
  ) as m(title, summary, sort_order)
  returning id, package_id, sort_order
)
insert into public.lessons (module_id, slug, title, description, provider, video_asset_id, duration_seconds, is_preview, sort_order)
select
  m.id,
  'leccion-' || l.sort_order,
  l.title,
  l.description,
  'bunny',
  null,
  l.duration_seconds,
  -- Primera leccion del primer modulo: gratuita como gancho de conversion.
  (m.sort_order = 1 and l.sort_order = 1),
  l.sort_order
from mod m
cross join lateral (
  values
    ('Vision general y resultado esperado', 'Que vas a construir y como se ve terminado.', 480, 1),
    ('Ejecucion guiada en pantalla', 'Implementacion completa sin cortes.', 1320, 2),
    ('Errores comunes y como evitarlos', 'Los fallos que mas dinero cuestan.', 720, 3)
) as l(title, description, duration_seconds, sort_order);
