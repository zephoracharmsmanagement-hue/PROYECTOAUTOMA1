-- =============================================================================
-- 0009 - Ingresos recurrentes registrados y metricas de negocio
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FACTURAS DE SUSCRIPCION
--
-- Hasta ahora solo se registraban los pagos unicos (`orders`). Sin las facturas
-- recurrentes no hay forma de calcular ingresos reales ni LTV, ni de pagar
-- comisiones de afiliado sobre renovaciones.
-- -----------------------------------------------------------------------------
create table public.subscription_invoices (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  subscription_id   uuid references public.subscriptions (id) on delete set null,
  stripe_invoice_id text not null unique,
  amount_cents      integer not null default 0 check (amount_cents >= 0),
  currency          text not null default 'usd',
  -- 'subscription_create' en el alta, 'subscription_cycle' en las renovaciones.
  billing_reason    text,
  paid_at           timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index subscription_invoices_user_idx on public.subscription_invoices (user_id, paid_at desc);
create index subscription_invoices_paid_idx on public.subscription_invoices (paid_at desc);

alter table public.subscription_invoices enable row level security;

create policy "subscription_invoices_select_own"
  on public.subscription_invoices for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- METRICAS DE NEGOCIO
--
-- Todo se calcula en SQL de una pasada: traerse las filas a la aplicacion para
-- agregarlas alli seria mas lento y no escalaria con el historico.
--
-- Sobre la honestidad de las cifras: la funcion devuelve tambien los tamanos de
-- muestra (`*_sample`). Con pocos clientes, el churn y el LTV son ruido, y la
-- interfaz debe decirlo en lugar de pintar un numero con aire de certeza.
-- -----------------------------------------------------------------------------
create or replace function public.admin_business_metrics(p_months integer default 12)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_months integer := greatest(1, least(coalesce(p_months, 12), 36));
  v_from timestamptz := date_trunc('month', now()) - ((v_months - 1) || ' months')::interval;
  v_series jsonb;
  v_packages jsonb;
  v_mrr_cents bigint;
  v_active_subs integer;
  v_subs_at_start integer;
  v_churned integer;
  v_churn_rate numeric;
  v_customers integer;
  v_revenue_total bigint;
  v_arpu numeric;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  -- ---------------------------------------------------------------- serie mensual
  with months as (
    select generate_series(v_from, date_trunc('month', now()), '1 month')::date as month
  ),
  one_time as (
    select date_trunc('month', o.created_at)::date as month, sum(o.amount_cents) as cents
    from public.orders o
    where o.status = 'paid' and o.created_at >= v_from
    group by 1
  ),
  recurring as (
    select date_trunc('month', si.paid_at)::date as month, sum(si.amount_cents) as cents
    from public.subscription_invoices si
    where si.paid_at >= v_from
    group by 1
  ),
  new_customers as (
    select date_trunc('month', e.granted_at)::date as month, count(distinct e.user_id) as total
    from public.entitlements e
    where e.granted_at >= v_from and e.source <> 'manual_grant'
    group by 1
  )
  select jsonb_agg(
           jsonb_build_object(
             'month', to_char(m.month, 'YYYY-MM'),
             'one_time_cents', coalesce(ot.cents, 0),
             'subscription_cents', coalesce(r.cents, 0),
             'new_customers', coalesce(nc.total, 0)
           ) order by m.month
         )
  into v_series
  from months m
  left join one_time ot on ot.month = m.month
  left join recurring r on r.month = m.month
  left join new_customers nc on nc.month = m.month;

  -- ------------------------------------------------------------------------ MRR
  -- Normalizado a mes: un plan anual aporta su precio dividido entre doce.
  select coalesce(sum(
           case p.interval
             when 'year' then p.price_cents / 12.0
             else p.price_cents
           end
         ), 0)::bigint
  into v_mrr_cents
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.status in ('active', 'trialing');

  select count(*) into v_active_subs
  from public.subscriptions s
  where s.status in ('active', 'trialing');

  -- ---------------------------------------------------------------------- churn
  -- Bajas de los ultimos 30 dias sobre la base activa al inicio del periodo.
  select count(*) into v_churned
  from public.subscriptions s
  where s.status = 'canceled' and s.updated_at >= now() - interval '30 days';

  v_subs_at_start := v_active_subs + v_churned;

  v_churn_rate := case
    when v_subs_at_start = 0 then null
    else round((v_churned::numeric / v_subs_at_start) * 100, 2)
  end;

  -- ----------------------------------------------------------------- ARPU y LTV
  select count(distinct user_id) into v_customers
  from public.entitlements
  where status = 'active';

  select coalesce((select sum(amount_cents) from public.orders where status = 'paid'), 0)
       + coalesce((select sum(amount_cents) from public.subscription_invoices), 0)
  into v_revenue_total;

  v_arpu := case when v_customers = 0 then null else v_revenue_total::numeric / v_customers end;

  -- ------------------------------------------------------- embudo por paquete
  select jsonb_agg(
           jsonb_build_object(
             'package_id', pk.id,
             'title', pk.title,
             'slug', pk.slug,
             'started', coalesce(f.started, 0),
             'paid', coalesce(f.paid, 0),
             'revenue_cents', coalesce(f.revenue, 0)
           ) order by coalesce(f.revenue, 0) desc
         )
  into v_packages
  from public.packages pk
  left join (
    select o.package_id,
           count(*) filter (where o.status in ('pending', 'expired', 'paid', 'failed')) as started,
           count(*) filter (where o.status = 'paid') as paid,
           sum(o.amount_cents) filter (where o.status = 'paid') as revenue
    from public.orders o
    group by o.package_id
  ) f on f.package_id = pk.id
  where pk.status <> 'archived';

  return jsonb_build_object(
    'months', v_months,
    'series', coalesce(v_series, '[]'::jsonb),
    'mrr_cents', v_mrr_cents,
    'arr_cents', v_mrr_cents * 12,
    'active_subscriptions', v_active_subs,
    'churned_30d', v_churned,
    'churn_rate_pct', v_churn_rate,
    -- Tamano de muestra del churn: la interfaz lo usa para avisar de que con
    -- pocos suscriptores el porcentaje no significa nada.
    'churn_sample', v_subs_at_start,
    'customers', v_customers,
    'revenue_cents_total', v_revenue_total,
    'arpu_cents', case when v_arpu is null then null else round(v_arpu) end,
    -- LTV = ARPU / tasa de cancelacion mensual. Sin bajas registradas no existe
    -- estimacion posible, y devolver un numero enorme seria enganoso.
    'ltv_cents', case
      when v_arpu is null or v_churn_rate is null or v_churn_rate = 0 then null
      else round(v_arpu / (v_churn_rate / 100))
    end,
    'packages', coalesce(v_packages, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_business_metrics(integer) from public, anon;
grant execute on function public.admin_business_metrics(integer) to authenticated;
