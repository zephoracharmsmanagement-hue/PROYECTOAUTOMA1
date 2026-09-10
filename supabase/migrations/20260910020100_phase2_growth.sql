-- =============================================================================
-- 0006 - Fase 2: order bumps, upsells, campanas, experimentos y certificados
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ORDER ITEMS
--
-- Hasta ahora una orden equivalia a un paquete. Con order bumps una misma sesion
-- de checkout puede contener varios, asi que la orden pasa a ser la transaccion
-- y las lineas viven aparte.
--
-- `orders.package_id` se conserva apuntando al paquete principal: mantiene
-- funcionando el historial ya existente y las vistas que lo muestran.
-- -----------------------------------------------------------------------------
create type public.order_item_kind as enum ('main', 'bump', 'upsell');

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  package_id   uuid references public.packages (id) on delete set null,
  kind         public.order_item_kind not null default 'main',
  amount_cents integer not null default 0 check (amount_cents >= 0),
  created_at   timestamptz not null default now(),
  -- Un paquete no puede aparecer dos veces en la misma orden.
  unique (order_id, package_id)
);

create index order_items_order_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy "order_items_select_own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

-- -----------------------------------------------------------------------------
-- OFERTAS: order bumps y upsells post-compra
--
-- Una tabla en lugar de columnas sueltas en `packages`: permite varias ofertas
-- por paquete, reordenarlas y activarlas o pausarlas sin migraciones nuevas.
-- -----------------------------------------------------------------------------
create type public.offer_placement as enum ('bump', 'upsell');

create table public.offers (
  id                 uuid primary key default gen_random_uuid(),
  -- Paquete cuyo checkout (bump) o pagina de exito (upsell) muestra la oferta.
  source_package_id  uuid not null references public.packages (id) on delete cascade,
  -- Paquete que se ofrece.
  offer_package_id   uuid not null references public.packages (id) on delete cascade,
  placement          public.offer_placement not null,
  headline           text not null,
  description        text,
  -- Precio especial de la oferta. Si es NULL se cobra el precio normal del
  -- paquete ofrecido. Debe ser un precio de pago unico creado en Stripe.
  stripe_price_id    text,
  price_cents        integer check (price_cents >= 0),
  is_active          boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Ofrecer un paquete dentro de si mismo no tiene sentido.
  constraint offer_not_self check (source_package_id <> offer_package_id),
  unique (source_package_id, offer_package_id, placement)
);

create index offers_source_idx on public.offers (source_package_id, placement, is_active, sort_order);

create trigger offers_touch
  before update on public.offers
  for each row execute function public.touch_updated_at();

alter table public.offers enable row level security;

create policy "offers_select_active"
  on public.offers for select
  using (is_active or public.is_admin(auth.uid()));

create policy "offers_write_admin"
  on public.offers for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- CAMPANAS
--
-- Una campana activa muestra una barra de anuncio en todo el sitio y, si tiene
-- codigo promocional de Stripe, lo aplica automaticamente en el checkout.
-- Aplicarlo solo convierte mejor que pedir al cliente que teclee un codigo.
-- -----------------------------------------------------------------------------
create table public.campaigns (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  headline                  text not null,
  subheadline               text,
  -- Codigo visible para el cliente, solo informativo: "LANZAMIENTO30".
  code_label                text,
  -- ID de Stripe (promo_...). Si esta presente, el descuento se auto-aplica.
  stripe_promotion_code_id  text,
  cta_label                 text,
  cta_href                  text,
  starts_at                 timestamptz,
  ends_at                   timestamptz,
  is_active                 boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint campaign_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create trigger campaigns_touch
  before update on public.campaigns
  for each row execute function public.touch_updated_at();

alter table public.campaigns enable row level security;

create policy "campaigns_select_active"
  on public.campaigns for select
  using (is_active or public.is_admin(auth.uid()));

create policy "campaigns_write_admin"
  on public.campaigns for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- EXPERIMENTOS (A/B)
--
-- `variants` es un array: [{ "id": "a", "label": "...", "weight": 50,
--                            "payload": { ... } }]
-- El payload es libre a proposito: el mismo motor sirve para probar titulares,
-- promesas o cualquier otro contenido sin tocar el esquema.
-- -----------------------------------------------------------------------------
create table public.experiments (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  name       text not null,
  hypothesis text,
  variants   jsonb not null default '[]'::jsonb,
  is_active  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger experiments_touch
  before update on public.experiments
  for each row execute function public.touch_updated_at();

alter table public.experiments enable row level security;

create policy "experiments_select_active"
  on public.experiments for select
  using (is_active or public.is_admin(auth.uid()));

create policy "experiments_write_admin"
  on public.experiments for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- CERTIFICADOS DE FINALIZACION
-- -----------------------------------------------------------------------------
create table public.certificates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  package_id uuid not null references public.packages (id) on delete cascade,
  -- Codigo publico de verificacion. No contiene datos personales.
  code       text not null unique,
  issued_at  timestamptz not null default now(),
  unique (user_id, package_id)
);

alter table public.certificates enable row level security;

create policy "certificates_select_own"
  on public.certificates for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

/*
 * Verificacion publica de un certificado.
 *
 * Es `security definer` para poder leer `profiles` y `certificates` sin abrir
 * esas tablas al publico: devuelve solo el nombre del titular, el paquete y la
 * fecha. Nunca el email ni el identificador del usuario.
 */
create or replace function public.verify_certificate(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'code', c.code,
    'issued_at', c.issued_at,
    'holder_name', coalesce(nullif(p.full_name, ''), split_part(p.email, '@', 1)),
    'package_title', pk.title,
    'package_slug', pk.slug
  )
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  join public.packages pk on pk.id = c.package_id
  where c.code = p_code;
$$;

grant execute on function public.verify_certificate(text) to anon, authenticated;

/*
 * Emite el certificado si el alumno ha completado TODAS las lecciones del
 * paquete. Idempotente: si ya existe, devuelve el codigo existente.
 *
 * Vive en SQL y no en la aplicacion porque la condicion ("todas las lecciones")
 * es una consulta de conjuntos: resolverla en el servidor evita traerse el
 * temario entero para contarlo.
 */
create or replace function public.issue_certificate_if_complete(p_package_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total integer;
  v_done integer;
  v_code text;
begin
  if v_user_id is null then
    return null;
  end if;

  -- Sin acceso al paquete no hay certificado que emitir.
  if not public.has_package_access(v_user_id, p_package_id) then
    return null;
  end if;

  select c.code into v_code
  from public.certificates c
  where c.user_id = v_user_id and c.package_id = p_package_id;

  if v_code is not null then
    return v_code;
  end if;

  select count(*) into v_total
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.package_id = p_package_id;

  select count(*) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  join public.modules m on m.id = l.module_id
  where m.package_id = p_package_id
    and lp.user_id = v_user_id
    and lp.completed_at is not null;

  if v_total = 0 or v_done < v_total then
    return null;
  end if;

  -- Codigo corto, legible y sin caracteres ambiguos.
  v_code := upper(
    translate(encode(gen_random_bytes(8), 'base64'), '+/=IO01l', 'ABCDEFGH')
  );

  insert into public.certificates (user_id, package_id, code)
  values (v_user_id, p_package_id, v_code)
  on conflict (user_id, package_id) do nothing;

  select c.code into v_code
  from public.certificates c
  where c.user_id = v_user_id and c.package_id = p_package_id;

  return v_code;
end;
$$;

grant execute on function public.issue_certificate_if_complete(uuid) to authenticated;
