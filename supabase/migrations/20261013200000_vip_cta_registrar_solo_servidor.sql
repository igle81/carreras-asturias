-- LOW de Seguridad: anon podía llamar a vip_cta_clicks_registrar por PostgREST
-- y saltarse el límite por IP de /api/vip-cta. El servidor no tiene
-- service_role, así que la función exige un token que solo conoce el servidor
-- (env VIP_CTA_TOKEN en Vercel). El token se guarda como hash en una tabla sin
-- grants para anon/authenticated. Solo esquema carreras (+ envoltorio public).
-- El valor del token NO está en el repo: se inserta aparte.

create extension if not exists pgcrypto with schema extensions;

create table if not exists carreras.vip_cta_secreto (
  id smallint primary key default 1 check (id = 1),
  token_hash text not null
);
alter table carreras.vip_cta_secreto enable row level security;
revoke all on table carreras.vip_cta_secreto from public, anon, authenticated;

drop function if exists public.vip_cta_clicks_registrar(text, text);
drop function if exists carreras.vip_cta_clicks_registrar(text, text);

create or replace function carreras.vip_cta_clicks_registrar(p_path text, p_user_agent text, p_token text)
returns boolean
language plpgsql
security definer
set search_path = carreras, pg_temp
as $$
declare
  ruta text;
begin
  if p_token is null
     or not exists (
       select 1 from carreras.vip_cta_secreto
       where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     )
  then
    return false;
  end if;

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

revoke all on function carreras.vip_cta_clicks_registrar(text, text, text) from public, anon, authenticated;
grant execute on function carreras.vip_cta_clicks_registrar(text, text, text) to service_role;

create or replace function public.vip_cta_clicks_registrar(p_path text, p_user_agent text, p_token text)
returns boolean
language sql
security definer
set search_path = carreras, pg_temp
as $$
  select carreras.vip_cta_clicks_registrar(p_path, p_user_agent, p_token);
$$;

revoke all on function public.vip_cta_clicks_registrar(text, text, text) from public, anon, authenticated;
-- anon solo puede ejecutar el envoltorio; sin el token del servidor devuelve false.
grant execute on function public.vip_cta_clicks_registrar(text, text, text) to anon, service_role;

notify pgrst, 'reload schema';
