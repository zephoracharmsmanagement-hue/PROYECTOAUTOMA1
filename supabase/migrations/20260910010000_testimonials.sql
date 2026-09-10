-- =============================================================================
-- 0004 - Testimonios
--
-- Prueba social para la landing y las fichas de venta. Un testimonio con
-- `package_id` NULL es global (se muestra en la portada); con paquete asignado
-- aparece ademas en la ficha de ese paquete.
--
-- IMPORTANTE: estos datos alimentan marcado JSON-LD de tipo Review. Solo deben
-- contener testimonios REALES y verificables. Publicar reseñas inventadas en
-- datos estructurados infringe las politicas de Google y la normativa de
-- proteccion al consumidor.
-- =============================================================================

create table public.testimonials (
  id                uuid primary key default gen_random_uuid(),
  -- NULL = testimonio general de la marca.
  package_id        uuid references public.packages (id) on delete cascade,
  author_name       text not null,
  author_role       text,
  author_avatar_url text,
  quote             text not null,
  -- Resultado concreto y medible: "3.400 USD en 30 dias".
  result            text,
  rating            smallint check (rating between 1 and 5),
  -- Enlace publico que respalda el testimonio (post, video, caso).
  source_url        text,
  status            public.content_status not null default 'draft',
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index testimonials_package_idx on public.testimonials (package_id, status, sort_order);

create trigger testimonials_touch
  before update on public.testimonials
  for each row execute function public.touch_updated_at();

alter table public.testimonials enable row level security;

create policy "testimonials_select_published"
  on public.testimonials for select
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "testimonials_write_admin"
  on public.testimonials for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
