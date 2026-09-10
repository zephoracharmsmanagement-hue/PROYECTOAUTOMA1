-- =============================================================================
-- 0002 - Funciones de acceso + Row Level Security
--
-- Principio: el acceso al contenido se decide EXCLUSIVAMENTE por la tabla
-- `entitlements`. Nada consulta a Stripe en tiempo de lectura. El webhook de
-- Stripe (service_role) es el unico que escribe entitlements/orders/subscriptions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- HELPERS DE ACCESO
-- -----------------------------------------------------------------------------

-- ¿El usuario tiene una membresia all-access vigente?
create or replace function public.has_all_access(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.entitlements e
    where e.user_id = p_user_id
      and e.kind = 'all_access'
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

-- ¿El usuario puede acceder a un paquete concreto?
-- Vale por compra directa o por membresia (si el paquete esta incluido en ella).
create or replace function public.has_package_access(p_user_id uuid, p_package_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.entitlements e
    where e.user_id = p_user_id
      and e.kind = 'package'
      and e.package_id = p_package_id
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  )
  or exists (
    select 1
    from public.packages p
    where p.id = p_package_id
      and p.included_in_subscription
      and public.has_all_access(p_user_id)
  );
$$;

create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = p_user_id and p.role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- ACTIVAR RLS EN TODAS LAS TABLAS
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.packages        enable row level security;
alter table public.modules         enable row level security;
alter table public.lessons         enable row level security;
alter table public.plans           enable row level security;
alter table public.orders          enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.entitlements    enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.webhook_events  enable row level security;
alter table public.leads           enable row level security;

-- -----------------------------------------------------------------------------
-- PROFILES
-- -----------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

-- El usuario edita su perfil pero NO puede escalar su rol ni robar un customer id.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and stripe_customer_id is not distinct from
        (select p.stripe_customer_id from public.profiles p where p.id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- CATALOGO (lectura publica solo de lo publicado)
-- -----------------------------------------------------------------------------
create policy "packages_select_published"
  on public.packages for select
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "modules_select_published"
  on public.modules for select
  using (
    exists (
      select 1 from public.packages p
      where p.id = modules.package_id and p.status = 'published'
    )
    or public.is_admin(auth.uid())
  );

-- Las lecciones contienen `video_asset_id`: solo las ve quien tiene acceso.
-- El temario publico se sirve por la vista `public.lesson_outline` (sin asset id).
create policy "lessons_select_entitled"
  on public.lessons for select
  using (
    is_preview
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.modules m
      where m.id = lessons.module_id
        and public.has_package_access(auth.uid(), m.package_id)
    )
  );

create policy "plans_select_active"
  on public.plans for select
  using (is_active or public.is_admin(auth.uid()));

-- Temario publico: metadatos de leccion SIN identificadores de video.
-- La vista corre con los permisos de su propietario (security definer por
-- defecto), de modo que expone el temario sin filtrar el asset del video.
create view public.lesson_outline as
select
  l.id,
  l.module_id,
  m.package_id,
  l.slug,
  l.title,
  l.description,
  l.duration_seconds,
  l.is_preview,
  l.sort_order
from public.lessons l
join public.modules m on m.id = l.module_id
join public.packages p on p.id = m.package_id
where p.status = 'published';

grant select on public.lesson_outline to anon, authenticated;

-- -----------------------------------------------------------------------------
-- DATOS DEL USUARIO (solo lectura propia; la escritura es del service_role)
-- -----------------------------------------------------------------------------
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "entitlements_select_own"
  on public.entitlements for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- PROGRESO (el alumno si escribe, pero solo sobre lecciones a las que accede)
-- -----------------------------------------------------------------------------
create policy "progress_select_own"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "progress_upsert_own"
  on public.lesson_progress for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.id = lesson_progress.lesson_id
        and public.has_package_access(auth.uid(), m.package_id)
    )
  );

create policy "progress_update_own"
  on public.lesson_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- LEADS: captura anonima permitida, lectura restringida a admin.
-- -----------------------------------------------------------------------------
create policy "leads_insert_public"
  on public.leads for insert
  with check (true);

create policy "leads_select_admin"
  on public.leads for select
  using (public.is_admin(auth.uid()));

-- `webhook_events` queda sin politicas: inaccesible salvo para service_role.
