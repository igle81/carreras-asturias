-- El bot padre @AvilesIA_bot (webhook de alquileres) enruta /start por prefijo.
-- Carreras usa ca_ + 36 hex. El webhook de alquileres todavía no llama a esta función.

alter table carreras.alertas_telegram
  drop constraint if exists alertas_telegram_codigo_fmt;
alter table carreras.alertas_telegram
  add constraint alertas_telegram_codigo_fmt
  check (codigo is null or codigo ~ '^ca_[0-9a-f]{36}$');

create or replace function carreras.alertas_telegram_codigo()
returns text
language plpgsql
security definer
set search_path = carreras, public, extensions
as $$
declare
  v text := 'ca_' || encode(extensions.gen_random_bytes(18), 'hex');
begin
  if auth.uid() is null then
    raise exception 'sin sesión' using errcode = '42501';
  end if;
  insert into carreras.alertas_telegram (user_id, codigo, codigo_caduca, actualizado_en)
  values (auth.uid(), v, now() + interval '1 hour', now())
  on conflict (user_id) do update
    set codigo = excluded.codigo,
        codigo_caduca = excluded.codigo_caduca,
        actualizado_en = now();
  return v;
end;
$$;

create or replace function carreras.alertas_telegram_vincular(p_codigo text, p_chat_id bigint)
returns boolean
language plpgsql
security definer
set search_path = carreras, public
as $$
declare
  n int;
begin
  -- El payload completo, con prefijo. No aceptar el hex pelado: podría ser de otra app.
  if p_codigo !~ '^ca_[0-9a-f]{36}$' or p_chat_id <= 0 then
    return false;
  end if;
  update carreras.alertas_telegram
    set chat_id = p_chat_id,
        conectado_en = now(),
        codigo = null,
        codigo_caduca = null,
        actualizado_en = now()
  where codigo = p_codigo
    and codigo_caduca > now();
  get diagnostics n = row_count;
  return n = 1;
end;
$$;

revoke all on function carreras.alertas_telegram_codigo() from public, anon;
grant execute on function carreras.alertas_telegram_codigo() to authenticated, service_role;

revoke all on function carreras.alertas_telegram_vincular(text, bigint) from public;
grant execute on function carreras.alertas_telegram_vincular(text, bigint) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
