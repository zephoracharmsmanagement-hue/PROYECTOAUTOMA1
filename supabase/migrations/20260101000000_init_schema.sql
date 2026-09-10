-- =============================================================================
-- 0001 - Esquema inicial
-- Plataforma de venta de paquetes SaaS para ecommerce / dropshipping.
-- Modelo hibrido: pago unico por paquete + suscripcion all-access.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.order_status as enum ('pending', 'paid', 'refunded', 'failed');
create type public.entitlement_kind as enum ('package', 'all_access');
create type public.entitlement_source as enum ('purchase', 'subscription', 'manual_grant');
create type public.entitlement_status as enum ('active', 'revoked', 'expired');
create type public.billing_interval as enum ('month', 'year');
create type public.video_provider as enum ('bunny', 'mux', 'youtube', 'none');

-- -----------------------------------------------------------------------------
-- PROFILES  (1:1 con auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  email               text not null,
  full_name           text,
  avatar_url          text,
  role                public.user_role not null default 'customer',
  -- Un unico customer de Stripe por usuario: enlaza compras y suscripciones.
  stripe_customer_id  text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on column public.profiles.stripe_customer_id is
  'Se crea perezosamente en el primer checkout y se reutiliza siempre.';

-- Alta automatica del perfil al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- CATALOGO: packages -> modules -> lessons
-- -----------------------------------------------------------------------------
create table public.packages (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text not null unique,
  title                     text not null,
  subtitle                  text,
  description               text,
  -- Promesa comercial principal mostrada en la card del catalogo.
  outcome                   text,
  category                  text not null default 'ecommerce',
  level                     text not null default 'intermedio',
  cover_url                 text,
  -- Bullets de valor: [{ "title": "...", "detail": "..." }]
  features                  jsonb not null default '[]'::jsonb,
  -- Precio de pago unico en la menor unidad monetaria (centavos).
  price_one_time_cents      integer check (price_one_time_cents >= 0),
  compare_at_price_cents    integer check (compare_at_price_cents >= 0),
  currency                  text not null default 'usd',
  stripe_price_id_one_time  text unique,
  -- Si false, el paquete NO se desbloquea con la suscripcion all-access.
  included_in_subscription  boolean not null default true,
  status                    public.content_status not null default 'draft',
  sort_order                integer not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index packages_status_sort_idx on public.packages (status, sort_order);

create table public.modules (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references public.packages (id) on delete cascade,
  title       text not null,
  summary     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index modules_package_idx on public.modules (package_id, sort_order);

create table public.lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.modules (id) on delete cascade,
  slug             text not null,
  title            text not null,
  description      text,
  provider         public.video_provider not null default 'bunny',
  -- GUID del video en Bunny Stream (o asset id del proveedor correspondiente).
  video_asset_id   text,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  -- Leccion gratuita: reproducible sin entitlement (gancho de conversion).
  is_preview       boolean not null default false,
  -- Descargables: [{ "label": "Plantilla", "url": "https://..." }]
  resources        jsonb not null default '[]'::jsonb,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  unique (module_id, slug)
);

create index lessons_module_idx on public.lessons (module_id, sort_order);

-- -----------------------------------------------------------------------------
-- PLANES DE SUSCRIPCION (all-access)
-- -----------------------------------------------------------------------------
create table public.plans (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text,
  interval        public.billing_interval not null,
  price_cents     integer not null check (price_cents >= 0),
  currency        text not null default 'usd',
  stripe_price_id text not null unique,
  features        jsonb not null default '[]'::jsonb,
  trial_days      integer not null default 0 check (trial_days >= 0),
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- TRANSACCIONES
-- -----------------------------------------------------------------------------
create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.profiles (id) on delete cascade,
  package_id                  uuid references public.packages (id) on delete set null,
  stripe_checkout_session_id  text not null unique,
  stripe_payment_intent_id    text,
  amount_cents                integer not null check (amount_cents >= 0),
  currency                    text not null default 'usd',
  status                      public.order_status not null default 'pending',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);

create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles (id) on delete cascade,
  plan_id                 uuid references public.plans (id) on delete set null,
  stripe_subscription_id  text not null unique,
  stripe_price_id         text,
  -- Estado crudo de Stripe: active, trialing, past_due, canceled, unpaid, ...
  status                  text not null,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id, status);

-- -----------------------------------------------------------------------------
-- ENTITLEMENTS - unica fuente de verdad para el acceso al contenido
-- -----------------------------------------------------------------------------
create table public.entitlements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  kind            public.entitlement_kind not null,
  -- Obligatorio cuando kind = 'package'; NULL cuando kind = 'all_access'.
  package_id      uuid references public.packages (id) on delete cascade,
  source          public.entitlement_source not null,
  status          public.entitlement_status not null default 'active',
  order_id        uuid references public.orders (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete cascade,
  granted_at      timestamptz not null default now(),
  -- NULL = acceso vitalicio (tipico de la compra de pago unico).
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  constraint entitlement_package_shape check (
    (kind = 'package' and package_id is not null)
    or (kind = 'all_access' and package_id is null)
  )
);

-- Idempotencia: una sola concesion viva por usuario+paquete y por usuario+all-access.
create unique index entitlements_unique_package_idx
  on public.entitlements (user_id, package_id)
  where kind = 'package';

create unique index entitlements_unique_all_access_idx
  on public.entitlements (user_id)
  where kind = 'all_access';

create index entitlements_user_status_idx on public.entitlements (user_id, status);

-- -----------------------------------------------------------------------------
-- PROGRESO DEL ALUMNO
-- -----------------------------------------------------------------------------
create table public.lesson_progress (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  lesson_id       uuid not null references public.lessons (id) on delete cascade,
  seconds_watched integer not null default 0 check (seconds_watched >= 0),
  completed_at    timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- -----------------------------------------------------------------------------
-- SOPORTE: idempotencia de webhooks y captura de leads
-- -----------------------------------------------------------------------------
create table public.webhook_events (
  id               uuid primary key default gen_random_uuid(),
  stripe_event_id  text not null unique,
  type             text not null,
  payload          jsonb,
  processed_at     timestamptz not null default now()
);

create table public.leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text not null default 'landing',
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (email, source)
);

-- -----------------------------------------------------------------------------
-- updated_at automatico
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch      before update on public.profiles      for each row execute function public.touch_updated_at();
create trigger packages_touch      before update on public.packages      for each row execute function public.touch_updated_at();
create trigger orders_touch        before update on public.orders        for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions for each row execute function public.touch_updated_at();
create trigger progress_touch      before update on public.lesson_progress for each row execute function public.touch_updated_at();
