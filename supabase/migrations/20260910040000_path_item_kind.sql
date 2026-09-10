-- =============================================================================
-- 0010 - Linea de orden de tipo 'path'
--
-- En fichero propio: Postgres no permite usar un valor de enum recien anadido
-- dentro de la misma transaccion que lo anade.
-- =============================================================================

alter type public.order_item_kind add value if not exists 'path';
