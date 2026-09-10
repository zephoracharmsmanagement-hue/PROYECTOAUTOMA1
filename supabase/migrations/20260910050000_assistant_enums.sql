-- =============================================================================
-- 0012 - Enums del asistente
-- En fichero propio por la restriccion de enums de Postgres.
-- =============================================================================

create type public.chunk_source as enum (
  'package_description',
  'lesson_description',
  'lesson_transcript',
  'lesson_resource'
);

create type public.assistant_role as enum ('user', 'assistant');
