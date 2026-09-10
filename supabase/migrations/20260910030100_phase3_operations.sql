-- =============================================================================
-- 0008 - Fase 3: dunning, afiliados, Q&A y metricas de negocio
-- =============================================================================

-- -----------------------------------------------------------------------------
-- DUNNING: recuperacion de pagos fallidos
--
-- Stripe ya reintenta el cobro. Lo que falta es el lado humano: avisar con un
-- tono que escale y saber, desde la aplicacion, quien esta en riesgo.
-- `attempts` viene de `invoice.attempt_count`, asi que no hace falta un cron:
-- cada reintento de Stripe trae su propio numero.
-- -----------------------------------------------------------------------------
alter table public.subscriptions
  add column dunning_attempts integer not null default 0 check (dunning_attempts >= 0),
  add column dunning_last_at  timestamptz,
  -- Fin del periodo de gracia. Hasta esa fecha el acceso se mantiene aunque el
  -- cobro falle: cortar durante los reintentos provoca bajas evitables.
  add column grace_until      timestamptz;

-- -----------------------------------------------------------------------------
-- AFILIADOS
-- -----------------------------------------------------------------------------
create table public.affiliates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references public.profiles (id) on delete cascade,
  -- Codigo publico que viaja en ?ref=
  code           text not null unique,
  commission_pct numeric(5, 2) not null default 30 check (commission_pct >= 0 and commission_pct <= 100),
  is_active      boolean not null default true,
  -- Como se le paga: texto libre (IBAN, PayPal, Wise). No se validan datos
  -- bancarios aqui a proposito; el pago se hace fuera de la plataforma.
  payout_details text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger affiliates_touch
  before update on public.affiliates
  for each row execute function public.touch_updated_at();

-- Atribucion persistente: una vez que un cliente entra por un afiliado, sus
-- renovaciones siguen generando comision sin depender de que la cookie siga viva.
alter table public.profiles
  add column referred_by_affiliate_id uuid references public.affiliates (id) on delete set null;

create table public.referrals (
  id               uuid primary key default gen_random_uuid(),
  affiliate_id     uuid not null references public.affiliates (id) on delete cascade,
  referred_user_id uuid references public.profiles (id) on delete set null,
  order_id         uuid references public.orders (id) on delete set null,
  subscription_id  uuid references public.subscriptions (id) on delete set null,
  -- Referencia de Stripe (sesion de checkout o factura). Unica: es lo que impide
  -- que un reintento de webhook duplique la comision.
  stripe_reference text not null unique,
  amount_cents     integer not null default 0 check (amount_cents >= 0),
  commission_cents integer not null default 0 check (commission_cents >= 0),
  currency         text not null default 'usd',
  status           public.referral_status not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index referrals_affiliate_idx on public.referrals (affiliate_id, status, created_at desc);

create trigger referrals_touch
  before update on public.referrals
  for each row execute function public.touch_updated_at();

alter table public.affiliates enable row level security;
alter table public.referrals  enable row level security;

-- El afiliado ve su propia ficha y sus comisiones; nada mas.
create policy "affiliates_select_own"
  on public.affiliates for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "affiliates_write_admin"
  on public.affiliates for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "referrals_select_own"
  on public.referrals for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.affiliates a
      where a.id = referrals.affiliate_id and a.user_id = auth.uid()
    )
  );

create policy "referrals_write_admin"
  on public.referrals for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Nombre visible de un usuario.
--
-- Si no hay nombre completo se usa la parte local del email. Nunca se expone el
-- email entero: en un hilo publico entre miembros seria una fuga de dato
-- personal y un iman para el spam.
-- -----------------------------------------------------------------------------
create or replace function public.display_name(p_full_name text, p_email text)
returns text
language sql
immutable
as $$
  select coalesce(nullif(trim(p_full_name), ''), split_part(p_email, '@', 1));
$$;

-- -----------------------------------------------------------------------------
-- Q&A PARA MIEMBROS
--
-- Las preguntas cuelgan de un paquete y, opcionalmente, de una leccion concreta.
-- Solo las ve y las escribe quien tiene acceso a ese paquete: la propia RLS
-- reutiliza `has_package_access`, de modo que la regla de acceso no se duplica.
-- -----------------------------------------------------------------------------
create table public.questions (
  id         uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  lesson_id  uuid references public.lessons (id) on delete set null,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text not null,
  status     public.question_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index questions_package_idx on public.questions (package_id, status, created_at desc);
create index questions_lesson_idx on public.questions (lesson_id, created_at desc);

create table public.answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  -- Respuesta del equipo: se destaca en la interfaz.
  is_staff    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index answers_question_idx on public.answers (question_id, created_at);

create trigger questions_touch before update on public.questions for each row execute function public.touch_updated_at();
create trigger answers_touch   before update on public.answers   for each row execute function public.touch_updated_at();

alter table public.questions enable row level security;
alter table public.answers   enable row level security;

create policy "questions_select_entitled"
  on public.questions for select
  using (
    (status <> 'hidden' and public.has_package_access(auth.uid(), package_id))
    or auth.uid() = user_id
    or public.is_admin(auth.uid())
  );

create policy "questions_insert_entitled"
  on public.questions for insert
  with check (
    auth.uid() = user_id
    and public.has_package_access(auth.uid(), package_id)
  );

-- El autor puede corregir su pregunta pero no cambiarle el estado ni el paquete.
create policy "questions_update_own"
  on public.questions for update
  using (auth.uid() = user_id and status <> 'hidden')
  with check (
    auth.uid() = user_id
    and status = (select q.status from public.questions q where q.id = questions.id)
    and package_id = (select q.package_id from public.questions q where q.id = questions.id)
  );

create policy "questions_write_admin"
  on public.questions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "answers_select_entitled"
  on public.answers for select
  using (
    exists (
      select 1 from public.questions q
      where q.id = answers.question_id
        and (
          public.has_package_access(auth.uid(), q.package_id)
          or q.user_id = auth.uid()
          or public.is_admin(auth.uid())
        )
    )
  );

create policy "answers_insert_entitled"
  on public.answers for insert
  with check (
    auth.uid() = user_id
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.questions q
        where q.id = answers.question_id
          and public.has_package_access(auth.uid(), q.package_id)
      )
    )
    -- Solo un admin puede marcar una respuesta como oficial del equipo.
    and (is_staff = false or public.is_admin(auth.uid()))
  );

create policy "answers_update_own"
  on public.answers for update
  using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "answers_delete_admin"
  on public.answers for delete
  using (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Lectura del hilo de Q&A con nombres visibles.
--
-- `profiles` solo es legible por su propio dueno, asi que un miembro no puede
-- leer el nombre de quien pregunta. Esta funcion resuelve ese choque: revalida
-- el acceso al paquete y devuelve unicamente el nombre visible del autor, nunca
-- su email ni su identificador.
-- -----------------------------------------------------------------------------
create or replace function public.package_thread(p_package_id uuid, p_lesson_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then
    return '[]'::jsonb;
  end if;

  -- La misma regla de acceso que protege el contenido protege la conversacion.
  if not (public.has_package_access(v_user_id, p_package_id) or public.is_admin(v_user_id)) then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'title', q.title,
        'body', q.body,
        'status', q.status,
        'created_at', q.created_at,
        'authorName', public.display_name(qp.full_name, qp.email),
        'answers', coalesce(a.answers, '[]'::jsonb)
      ) order by q.created_at desc
    ),
    '[]'::jsonb
  )
  into v_result
  from public.questions q
  join public.profiles qp on qp.id = q.user_id
  left join lateral (
    select jsonb_agg(
             jsonb_build_object(
               'id', ans.id,
               'body', ans.body,
               'is_staff', ans.is_staff,
               'created_at', ans.created_at,
               'authorName', public.display_name(ap.full_name, ap.email)
             ) order by ans.created_at
           ) as answers
    from public.answers ans
    join public.profiles ap on ap.id = ans.user_id
    where ans.question_id = q.id
  ) a on true
  where q.package_id = p_package_id
    and (p_lesson_id is null or q.lesson_id = p_lesson_id)
    and (q.status <> 'hidden' or q.user_id = v_user_id or public.is_admin(v_user_id));

  return v_result;
end;
$$;

grant execute on function public.package_thread(uuid, uuid) to authenticated;
