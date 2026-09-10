-- =============================================================================
-- 0005 - Estado 'expired' para ordenes
--
-- Va en su propia migracion a proposito: en Postgres, un valor nuevo de enum no
-- puede usarse en la misma transaccion en que se anade. Separandolo, la
-- migracion siguiente ya puede referenciarlo con seguridad.
--
-- Semantica: 'failed' es un cobro rechazado; 'expired' es un carrito abandonado
-- (la sesion de checkout caduco sin pagar). Distinguirlos es lo que permite
-- medir y recuperar abandonos.
-- =============================================================================

alter type public.order_status add value if not exists 'expired';
