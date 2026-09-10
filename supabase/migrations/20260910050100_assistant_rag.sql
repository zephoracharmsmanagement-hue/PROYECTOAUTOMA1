-- =============================================================================
-- 0013 - Asistente con IA sobre el contenido de los paquetes
--
-- Recuperacion lexica sobre Postgres: busqueda de texto completo en espanol mas
-- similitud por trigramas. No requiere ningun proveedor de embeddings.
--
-- Para pasar a busqueda vectorial: activar `vector`, anadir una columna
-- `embedding` a `content_chunks` y ampliar `search_content_chunks`. La interfaz
-- `Retriever` de la aplicacion ya esta preparada; ver docs/assistant.md.
-- =============================================================================

create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Transcripcion de la leccion: la materia prima del asistente.
alter table public.lessons add column transcript text;

comment on column public.lessons.transcript is
  'Transcripcion del video. Es lo que indexa el asistente para poder responder.';

-- -----------------------------------------------------------------------------
-- FRAGMENTOS INDEXADOS
-- -----------------------------------------------------------------------------
create table public.content_chunks (
  id             uuid primary key default gen_random_uuid(),
  package_id     uuid not null references public.packages (id) on delete cascade,
  lesson_id      uuid references public.lessons (id) on delete cascade,
  source         public.chunk_source not null,
  -- Titulo del fragmento: se cita al alumno para que sepa de donde sale.
  heading        text not null,
  content        text not null,
  -- Posicion dentro de su origen, para reconstruir el orden de lectura.
  position       integer not null default 0,
  -- Indice de busqueda. `to_tsvector` con configuracion explicita es inmutable,
  -- asi que puede ser columna generada y no necesita trigger de mantenimiento.
  tsv            tsvector generated always as (
                   to_tsvector('spanish', coalesce(heading, '') || ' ' || coalesce(content, ''))
                 ) stored,
  created_at     timestamptz not null default now()
);

create index content_chunks_tsv_idx on public.content_chunks using gin (tsv);
create index content_chunks_trgm_idx on public.content_chunks using gin (content gin_trgm_ops);
create index content_chunks_package_idx on public.content_chunks (package_id, lesson_id, position);

alter table public.content_chunks enable row level security;

-- Los fragmentos son el contenido de pago troceado: mismo control de acceso.
create policy "content_chunks_select_entitled"
  on public.content_chunks for select
  using (public.is_admin(auth.uid()) or public.has_package_access(auth.uid(), package_id));

create policy "content_chunks_write_admin"
  on public.content_chunks for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- CONVERSACIONES
-- -----------------------------------------------------------------------------
create table public.assistant_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  package_id uuid references public.packages (id) on delete set null,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assistant_conversations_user_idx
  on public.assistant_conversations (user_id, updated_at desc);

create table public.assistant_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations (id) on delete cascade,
  role            public.assistant_role not null,
  content         text not null,
  -- Fragmentos citados en la respuesta: [{ "heading": "...", "lesson_slug": "..." }]
  citations       jsonb not null default '[]'::jsonb,
  input_tokens    integer not null default 0,
  output_tokens   integer not null default 0,
  created_at      timestamptz not null default now()
);

create index assistant_messages_conversation_idx
  on public.assistant_messages (conversation_id, created_at);

-- Para el limite de uso diario, que se cuenta por usuario y no por conversacion.
create index assistant_messages_user_day_idx on public.assistant_messages (created_at desc);

create trigger assistant_conversations_touch
  before update on public.assistant_conversations
  for each row execute function public.touch_updated_at();

alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages      enable row level security;

create policy "assistant_conversations_own"
  on public.assistant_conversations for all
  using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id);

create policy "assistant_messages_select_own"
  on public.assistant_messages for select
  using (
    exists (
      select 1 from public.assistant_conversations c
      where c.id = assistant_messages.conversation_id
        and (c.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

-- -----------------------------------------------------------------------------
-- BUSQUEDA
--
-- `security definer` para poder consultar `content_chunks` sin quedar atrapada
-- en su propia politica, pero comprueba el acceso paquete a paquete: el
-- asistente NUNCA puede citar contenido que el alumno no haya comprado.
-- -----------------------------------------------------------------------------
create or replace function public.search_content_chunks(
  p_query text,
  p_package_id uuid default null,
  p_limit integer default 8
)
returns table (
  id uuid,
  package_id uuid,
  lesson_id uuid,
  heading text,
  content text,
  score real
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_query tsquery;
begin
  if v_user_id is null or coalesce(trim(p_query), '') = '' then
    return;
  end if;

  -- `websearch_to_tsquery` acepta lenguaje natural sin romperse con comillas ni
  -- operadores sueltos, que es exactamente lo que escribe un alumno.
  v_query := websearch_to_tsquery('spanish', p_query);

  return query
  select
    c.id,
    c.package_id,
    c.lesson_id,
    c.heading,
    c.content,
    -- Combinacion de ranking lexico y similitud difusa: lo primero acierta con
    -- terminologia exacta, lo segundo salva erratas y variantes.
    (ts_rank_cd(c.tsv, v_query) + similarity(c.content, p_query) * 0.3)::real as score
  from public.content_chunks c
  where public.has_package_access(v_user_id, c.package_id)
    and (p_package_id is null or c.package_id = p_package_id)
    and (c.tsv @@ v_query or similarity(c.content, p_query) > 0.1)
  order by score desc
  limit least(greatest(coalesce(p_limit, 8), 1), 20);
end;
$$;

grant execute on function public.search_content_chunks(text, uuid, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- LIMITE DE USO
--
-- Cada mensaje al asistente cuesta dinero real. Sin tope, una sola cuenta puede
-- generar una factura desagradable en una tarde.
-- -----------------------------------------------------------------------------
create or replace function public.assistant_messages_today()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.assistant_messages m
  join public.assistant_conversations c on c.id = m.conversation_id
  where c.user_id = auth.uid()
    and m.role = 'user'
    and m.created_at > now() - interval '24 hours';
$$;

grant execute on function public.assistant_messages_today() to authenticated;

-- -----------------------------------------------------------------------------
-- REINDEXADO
--
-- Reconstruye los fragmentos de un paquete a partir de su contenido actual.
-- Se ejecuta en SQL de una pasada: trocear en la aplicacion obligaria a traerse
-- todas las transcripciones y devolverlas.
--
-- El troceo por parrafos es deliberado: una transcripcion ya viene separada por
-- ideas, y partir por numero de caracteres corta frases por la mitad.
-- -----------------------------------------------------------------------------
create or replace function public.reindex_package_content(p_package_id uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  delete from public.content_chunks where package_id = p_package_id;

  -- Descripcion del paquete.
  insert into public.content_chunks (package_id, lesson_id, source, heading, content, position)
  select p.id, null, 'package_description', p.title, p.description, 0
  from public.packages p
  where p.id = p_package_id and coalesce(trim(p.description), '') <> '';

  -- Descripcion de cada leccion.
  insert into public.content_chunks (package_id, lesson_id, source, heading, content, position)
  select m.package_id, l.id, 'lesson_description', l.title, l.description, l.sort_order
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.package_id = p_package_id and coalesce(trim(l.description), '') <> '';

  -- Transcripcion troceada por parrafos, agrupando los muy cortos.
  insert into public.content_chunks (package_id, lesson_id, source, heading, content, position)
  select
    m.package_id,
    l.id,
    'lesson_transcript',
    l.title,
    part.chunk,
    part.idx
  from public.lessons l
  join public.modules m on m.id = l.module_id
  cross join lateral (
    select chunk, idx
    from (
      select
        trim(value) as chunk,
        ordinality::integer as idx
      from regexp_split_to_table(l.transcript, E'\\n\\s*\\n') with ordinality as t(value, ordinality)
    ) parts
    where length(chunk) > 40
  ) part
  where m.package_id = p_package_id
    and coalesce(trim(l.transcript), '') <> '';

  select count(*) into v_count from public.content_chunks where package_id = p_package_id;
  return v_count;
end;
$$;

grant execute on function public.reindex_package_content(uuid) to authenticated;
