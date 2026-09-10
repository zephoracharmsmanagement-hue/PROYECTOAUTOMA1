-- =============================================================================
-- 0007 - Enum de estado de comisiones
--
-- En fichero propio: Postgres no permite usar un tipo enum recien creado dentro
-- de la misma transaccion que lo define.
-- =============================================================================

create type public.referral_status as enum ('pending', 'approved', 'paid', 'void');
create type public.question_status as enum ('open', 'answered', 'hidden');
