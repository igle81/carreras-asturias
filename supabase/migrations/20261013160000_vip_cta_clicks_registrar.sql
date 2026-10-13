-- Clics VIP: la tabla deja de ser legible y escribible por anon/authenticated.
-- El insert entra por una función SECURITY DEFINER (search_path fijo) que
-- valida la ruta y guarda solo la familia del navegador. El contador público
-- sigue en public.vip_cta_clicks_count (solo el número).
-- No hay pg_cron en este proyecto: cada insert borra los clics de más de 12 meses.

create or replace function carreras.vip_cta_familia(p_user_agent text)
returns text
language sql
immutable
set search_path = carreras, pg_temp
as $$
  select case
    when p_user_agent is null or btrim(p_user_agent) = '' then null
    when lower(btrim(p_user_agent)) = 'edge' then 'Edge'
    when lower(btrim(p_user_agent)) = 'opera' then 'Opera'
    when lower(btrim(p_user_agent)) = 'samsung' then 'Samsung'
    when lower(btrim(p_user_agent)) = 'firefox' then 'Firefox'
    when lower(btrim(p_user_agent)) = 'chrome' then 'Chrome'
    when lower(btrim(p_user_agent)) = 'safari' then 'Safari'
    when lower(btrim(p_user_agent)) = 'otro' then 'Otro'
    when p_user_agent ilike '%edg/%' or p_user_agent ilike '%edge/%' then 'Edge'
    when p_user_agent ilike '%opr/%' or p_user_agent ilike '%opera%' then 'Opera'
    when p_user_agent ilike '%samsungbrowser%' then 'Samsung'
    when p_user_agent ilike '%firefox%' or p_user_agent ilike '%fxios%' then 'Firefox'
    when p_user_agent ilike '%chrome%' or p_user_agent ilike '%crios%' or p_user_agent ilike '%chromium%' then 'Chrome'
    when p_user_agent ilike '%safari%' then 'Safari'
    else 'Otro'
  end;
$$;

revoke all on function carreras.vip_cta_familia(text) from public, anon, authenticated;
grant execute on function carreras.vip_cta_familia(text) to service_role;

create or replace function carreras.vip_cta_clicks_registrar(p_path text, p_user_agent text)
returns boolean
language plpgsql
security definer
set search_path = carreras, pg_temp
as $$
declare
  ruta text;
begin
  delete from carreras.vip_cta_clicks
  where clicked_at < now() - interval '12 months';

  ruta := btrim(coalesce(p_path, ''));
  if char_length(ruta) = 0
     or char_length(ruta) > 300
     or ruta !~ '^/[A-Za-z0-9._~%/]*$'
     or position('//' in ruta) > 0
     or position('..' in ruta) > 0
  then
    return false;
  end if;

  insert into carreras.vip_cta_clicks (path, user_agent)
  values (ruta, carreras.vip_cta_familia(left(coalesce(p_user_agent, ''), 400)));
  return true;
end;
$$;

revoke all on function carreras.vip_cta_clicks_registrar(text, text) from public, anon, authenticated;
grant execute on function carreras.vip_cta_clicks_registrar(text, text) to anon, service_role;

create or replace function public.vip_cta_clicks_registrar(p_path text, p_user_agent text)
returns boolean
language sql
security definer
set search_path = carreras, pg_temp
as $$
  select carreras.vip_cta_clicks_registrar(p_path, p_user_agent);
$$;

revoke all on function public.vip_cta_clicks_registrar(text, text) from public, anon, authenticated;
grant execute on function public.vip_cta_clicks_registrar(text, text) to anon, service_role;

drop policy if exists vip_cta_clicks_authenticated_select on carreras.vip_cta_clicks;
drop policy if exists vip_cta_clicks_anon_insert on carreras.vip_cta_clicks;

revoke all on table carreras.vip_cta_clicks from public, anon, authenticated;

update carreras.vip_cta_clicks
set user_agent = carreras.vip_cta_familia(user_agent)
where user_agent is not null
  and user_agent not in ('Edge', 'Opera', 'Samsung', 'Firefox', 'Chrome', 'Safari', 'Otro');

alter table carreras.vip_cta_clicks
  drop constraint if exists vip_cta_clicks_user_agent_familia;

alter table carreras.vip_cta_clicks
  add constraint vip_cta_clicks_user_agent_familia
  check (
    user_agent is null
    or user_agent in ('Edge', 'Opera', 'Samsung', 'Firefox', 'Chrome', 'Safari', 'Otro')
  );

delete from carreras.vip_cta_clicks
where clicked_at < now() - interval '12 months';

notify pgrst, 'reload schema';
