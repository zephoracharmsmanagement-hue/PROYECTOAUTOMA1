-- =============================================================================
-- 0011 - Fase 4: rutas de aprendizaje y automatizaciones instalables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RUTAS DE APRENDIZAJE
--
-- Una ruta encadena varios paquetes en un orden con sentido y puede venderse
-- como lote. Comprarla concede acceso a TODOS sus paquetes: el modelo de
-- entitlements ya soporta varios paquetes por orden desde los order bumps, asi
-- que no hace falta un tipo de acceso nuevo.
-- -----------------------------------------------------------------------------
create table public.paths (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text not null unique,
  title                     text not null,
  subtitle                  text,
  description               text,
  outcome                   text,
  cover_url                 text,
  -- Precio del lote. Suele ser menor que la suma de los paquetes sueltos: ese
  -- ahorro es el argumento de venta.
  price_one_time_cents      integer check (price_one_time_cents >= 0),
  currency                  text not null default 'usd',
  stripe_price_id_one_time  text unique,
  included_in_subscription  boolean not null default true,
  status                    public.content_status not null default 'draft',
  sort_order                integer not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index paths_status_sort_idx on public.paths (status, sort_order);

create table public.path_packages (
  path_id    uuid not null references public.paths (id) on delete cascade,
  package_id uuid not null references public.packages (id) on delete cascade,
  -- Por que este paquete va en este punto de la ruta.
  note       text,
  sort_order integer not null default 0,
  primary key (path_id, package_id)
);

create index path_packages_order_idx on public.path_packages (path_id, sort_order);

-- Traza de que orden compro que ruta. Nullable: la mayoria de las ordenes son
-- de paquete suelto.
alter table public.orders
  add column path_id uuid references public.paths (id) on delete set null;

create trigger paths_touch
  before update on public.paths
  for each row execute function public.touch_updated_at();

alter table public.paths         enable row level security;
alter table public.path_packages enable row level security;

create policy "paths_select_published"
  on public.paths for select
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "paths_write_admin"
  on public.paths for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "path_packages_select_published"
  on public.path_packages for select
  using (
    exists (
      select 1 from public.paths p
      where p.id = path_packages.path_id and p.status = 'published'
    )
    or public.is_admin(auth.uid())
  );

create policy "path_packages_write_admin"
  on public.path_packages for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- AUTOMATIZACIONES INSTALABLES
--
-- Flujos de n8n / Make que el alumno importa en su propia cuenta. El JSON se
-- guarda aqui y se sirve solo a quien tiene acceso al paquete: es contenido de
-- pago como el video.
--
-- ADVERTENCIA OPERATIVA: el JSON no debe contener credenciales reales. Se
-- exportan siempre sin credenciales y se documenta cuales hay que conectar.
-- -----------------------------------------------------------------------------
create type public.automation_platform as enum ('n8n', 'make', 'zapier', 'other');

create table public.automations (
  id           uuid primary key default gen_random_uuid(),
  package_id   uuid not null references public.packages (id) on delete cascade,
  -- Si apunta a una leccion, se muestra tambien dentro de ella.
  lesson_id    uuid references public.lessons (id) on delete set null,
  name         text not null,
  description  text,
  platform     public.automation_platform not null default 'n8n',
  version      text not null default '1.0.0',
  -- Flujo exportado, tal cual lo importa la plataforma destino.
  workflow     jsonb not null,
  setup_notes  text,
  -- Credenciales que el alumno debe conectar por su cuenta: ["OpenAI", "Gmail"]
  requires     jsonb not null default '[]'::jsonb,
  status       public.content_status not null default 'draft',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index automations_package_idx on public.automations (package_id, status, sort_order);
create index automations_lesson_idx on public.automations (lesson_id);

create trigger automations_touch
  before update on public.automations
  for each row execute function public.touch_updated_at();

alter table public.automations enable row level security;

-- El JSON del flujo es el producto: solo lo lee quien tiene acceso al paquete.
create policy "automations_select_entitled"
  on public.automations for select
  using (
    public.is_admin(auth.uid())
    or (status = 'published' and public.has_package_access(auth.uid(), package_id))
  );

create policy "automations_write_admin"
  on public.automations for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

/*
 * Catalogo publico de automatizaciones de un paquete.
 *
 * La ficha de venta necesita listar QUE automatizaciones incluye el paquete sin
 * entregar el flujo. Devuelve nombre, plataforma y credenciales necesarias;
 * nunca el JSON.
 */
create or replace function public.automation_catalog(p_package_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'description', a.description,
        'platform', a.platform,
        'requires', a.requires
      ) order by a.sort_order
    ),
    '[]'::jsonb
  )
  from public.automations a
  join public.packages p on p.id = a.package_id
  where a.package_id = p_package_id
    and a.status = 'published'
    and p.status = 'published';
$$;

grant execute on function public.automation_catalog(uuid) to anon, authenticated;
