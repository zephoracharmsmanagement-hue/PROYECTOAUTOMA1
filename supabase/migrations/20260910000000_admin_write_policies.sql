-- =============================================================================
-- 0003 - Permisos de escritura para el panel de administracion
--
-- El panel de admin usa el cliente del PROPIO usuario, no `service_role`. Es
-- deliberado: asi RLS sigue siendo quien autoriza y un fallo en la guardia de la
-- interfaz no basta para escribir nada. Estas politicas son el permiso real.
--
-- El rol se sigue asignando desde SQL a proposito: promover un administrador no
-- debe ser una accion disponible en la interfaz.
--   update public.profiles set role = 'admin' where email = 'tu@email.com';
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CATALOGO: alta, edicion y borrado para administradores
-- -----------------------------------------------------------------------------
create policy "packages_write_admin"
  on public.packages for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "modules_write_admin"
  on public.modules for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "lessons_write_admin"
  on public.lessons for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "plans_write_admin"
  on public.plans for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- ENTITLEMENTS: concesiones manuales (soporte, regalos, afiliados)
--
-- No se permite DELETE: revocar marca `status = 'revoked'` y conserva el rastro.
-- Borrar la fila destruiria la auditoria de por que alguien tuvo acceso.
-- -----------------------------------------------------------------------------
create policy "entitlements_insert_admin"
  on public.entitlements for insert
  with check (public.is_admin(auth.uid()));

create policy "entitlements_update_admin"
  on public.entitlements for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- OPERACION: leads y diagnostico de webhooks
-- -----------------------------------------------------------------------------
create policy "leads_delete_admin"
  on public.leads for delete
  using (public.is_admin(auth.uid()));

-- Permite responder a "el cliente pago y no tiene acceso" desde el panel.
create policy "webhook_events_select_admin"
  on public.webhook_events for select
  using (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Vista de metricas de negocio.
--
-- Agrega ingresos y volumen sin exponer filas individuales. Se consulta desde el
-- panel; el acceso queda restringido a administradores por el grant de abajo.
-- -----------------------------------------------------------------------------
create or replace function public.admin_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  select jsonb_build_object(
    'revenue_cents_total', coalesce((
      select sum(amount_cents) from public.orders where status = 'paid'
    ), 0),
    'revenue_cents_last_30d', coalesce((
      select sum(amount_cents) from public.orders
      where status = 'paid' and created_at > now() - interval '30 days'
    ), 0),
    'orders_paid', (select count(*) from public.orders where status = 'paid'),
    'orders_refunded', (select count(*) from public.orders where status = 'refunded'),
    'active_members', (
      select count(*) from public.entitlements
      where kind = 'all_access' and status = 'active'
        and (expires_at is null or expires_at > now())
    ),
    'canceling_members', (
      select count(*) from public.subscriptions
      where cancel_at_period_end and status = 'active'
    ),
    'customers', (select count(distinct user_id) from public.entitlements where status = 'active'),
    'leads', (select count(*) from public.leads),
    'published_packages', (select count(*) from public.packages where status = 'published'),
    'draft_packages', (select count(*) from public.packages where status = 'draft')
  )
  into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_metrics() from public, anon;
grant execute on function public.admin_dashboard_metrics() to authenticated;
