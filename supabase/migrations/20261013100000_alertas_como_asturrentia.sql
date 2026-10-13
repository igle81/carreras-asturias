-- Perfil de avisos al estilo de asturRentIA (correo, consentimiento, baja)
-- y el enlace de Telegram con @AvilesIA_bot. El push de Carreras sigue en OneSignal.

alter table carreras.suscripciones_alertas
  add column if not exists correo_avisos text,
  add column if not exists consentimiento boolean not null default false,
  add column if not exists consentimiento_en timestamptz,
  add column if not exists baja_en timestamptz,
  add column if not exists actualizado_en timestamptz not null default now();

alter table carreras.suscripciones_alertas
  drop constraint if exists suscripciones_alertas_correo_avisos_len;
alter table carreras.suscripciones_alertas
  add constraint suscripciones_alertas_correo_avisos_len
  check (correo_avisos is null or char_length(correo_avisos) between 3 and 320);

comment on column carreras.suscripciones_alertas.correo_avisos is
  'Correo donde llegan los avisos. Si en el alta se deja vacío, es el de la cuenta.';
comment on column carreras.suscripciones_alertas.consentimiento is
  'Acepta avisos por correo y, si los activa después, por Telegram y push.';

create table if not exists carreras.alertas_telegram (
  user_id uuid primary key references auth.users (id) on delete cascade,
  codigo text,
  codigo_caduca timestamptz,
  chat_id bigint,
  conectado_en timestamptz,
  actualizado_en timestamptz not null default now(),
  constraint alertas_telegram_codigo_fmt check (codigo is null or codigo ~ '^[0-9a-f]{36}$'),
  constraint alertas_telegram_chat_privado check (chat_id is null or chat_id > 0)
);

alter table carreras.alertas_telegram enable row level security;
revoke all on table carreras.alertas_telegram from public, anon, authenticated;
grant select on table carreras.alertas_telegram to authenticated;
grant all on table carreras.alertas_telegram to service_role;

drop policy if exists alertas_telegram_leer on carreras.alertas_telegram;
create policy alertas_telegram_leer
  on carreras.alertas_telegram
  for select
  to authenticated
  using (user_id = (select auth.uid()));

grant update on table carreras.suscripciones_alertas to authenticated;

drop policy if exists suscripciones_alertas_propias_cambiar on carreras.suscripciones_alertas;
create policy suscripciones_alertas_propias_cambiar
  on carreras.suscripciones_alertas
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

create or replace function carreras.alertas_telegram_codigo()
returns text
language plpgsql
security definer
set search_path = carreras, public, extensions
as $$
declare
  v text := encode(extensions.gen_random_bytes(18), 'hex');
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
  if p_codigo !~ '^[0-9a-f]{36}$' or p_chat_id <= 0 then
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
