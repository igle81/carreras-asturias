-- Aplicada en Supabase el 18-10-2026 (version 20261018132054, avisos_seguridad_rgpd). Después: get_advisors sin hallazgos nuevos salvo los INFO esperados de RLS sin políticas.
-- Carreras Asturias · avisos: arreglos de la revisión de Seguridad del 18-10-2026
-- (AVISOS-REALES-2026-10-18.md). Solo esquema carreras. No toca carreras_es ni el Site URL.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Baja: tokens de un solo uso (solo el hash). RLS sin políticas y sin grants:
--    solo se accede por las funciones SECURITY DEFINER de abajo.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists carreras.avisos_baja_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now(),
  caduca_en timestamptz not null default (now() + interval '60 days'),
  usado_en timestamptz
);
comment on table carreras.avisos_baja_tokens is
  'Tokens de baja de un solo uso del pie de los correos de avisos. Solo sha256 del token. Sin grants: acceso por avisos_baja_token_emitir / avisos_baja_por_token.';
create index if not exists avisos_baja_tokens_user_idx on carreras.avisos_baja_tokens (user_id);
alter table carreras.avisos_baja_tokens enable row level security;
revoke all on table carreras.avisos_baja_tokens from public, anon, authenticated, service_role;

-- n8n (service_role) pide un token por correo: devuelve el token en claro una sola vez y guarda solo el hash.
create or replace function carreras.avisos_baja_token_emitir(p_user_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  if p_user_id is null or not exists (
    select 1 from carreras.suscripciones_alertas s
     where s.user_id = p_user_id and s.baja_en is null
  ) then
    return null;
  end if;
  -- 32 bytes aleatorios en base64url sin relleno (43 caracteres)
  v_token := translate(encode(extensions.gen_random_bytes(32), 'base64'), E'+/=\n', '-_');
  insert into carreras.avisos_baja_tokens (token_hash, user_id)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), p_user_id);
  return v_token;
end
$$;
revoke all on function carreras.avisos_baja_token_emitir(uuid) from public, anon, authenticated;
grant execute on function carreras.avisos_baja_token_emitir(uuid) to service_role;

-- La web (/avisos/baja, clave anon) confirma la baja. Idempotente: un token ya usado devuelve true sin escribir.
-- Devuelve solo true/false; la ruta responde igual en ambos casos.
create or replace function carreras.avisos_baja_por_token(p_token text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_user uuid;
  v_usado timestamptz;
  v_caduca timestamptz;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    return false;
  end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');
  select t.user_id, t.usado_en, t.caduca_en
    into v_user, v_usado, v_caduca
    from carreras.avisos_baja_tokens t
   where t.token_hash = v_hash
   for update;
  if not found then
    return false;
  end if;
  if v_usado is not null then
    return true;
  end if;
  if v_caduca < now() then
    return false;
  end if;

  update carreras.suscripciones_alertas s
     set baja_en = coalesce(s.baja_en, now()),
         push_activado = false,
         actualizado_en = now()
   where s.user_id = v_user;
  delete from carreras.alertas_telegram t where t.user_id = v_user;
  -- todos los tokens de esa persona quedan usados (la baja es global e irreversible)
  update carreras.avisos_baja_tokens t
     set usado_en = coalesce(t.usado_en, now())
   where t.user_id = v_user;
  return true;
end
$$;
revoke all on function carreras.avisos_baja_por_token(text) from public, anon, authenticated;
grant execute on function carreras.avisos_baja_por_token(text) to anon, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Destinatarios válidos para n8n (sustituye la lectura completa de Auth y tablas).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function carreras.avisos_destinatarios()
returns table (user_id uuid, correo text, push_activado boolean, chat_id bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select d.user_id, d.correo, d.push_activado, d.chat_id
    from (
      select s.user_id,
             case
               when s.correo_avisos is not null
                and lower(btrim(s.correo_avisos)) = lower(btrim(u.email))
                and btrim(s.correo_avisos) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
               then lower(btrim(s.correo_avisos))
             end as correo,
             (s.push_activado is true) as push_activado,
             case when t.chat_id > 0 then t.chat_id end as chat_id
        from carreras.suscripciones_alertas s
        join auth.users u on u.id = s.user_id
        left join carreras.alertas_telegram t on t.user_id = s.user_id
       where s.consentimiento is true
         and s.baja_en is null
         and u.email_confirmed_at is not null
         and u.deleted_at is null
         and (u.banned_until is null or u.banned_until < now())
    ) d
   where d.correo is not null or d.push_activado or d.chat_id is not null
$$;
revoke all on function carreras.avisos_destinatarios() from public, anon, authenticated;
grant execute on function carreras.avisos_destinatarios() to service_role;

-- n8n apaga un canal muerto: Telegram 403 -> chat_id null; OneSignal invalid_aliases -> push_activado false.
create or replace function carreras.avisos_desactivar_canal(p_user_id uuid, p_canal text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n int := 0;
begin
  if p_user_id is null then
    return false;
  end if;
  if p_canal = 'telegram' then
    update carreras.alertas_telegram t
       set chat_id = null, conectado_en = null, actualizado_en = now()
     where t.user_id = p_user_id and t.chat_id is not null;
    get diagnostics n = row_count;
  elsif p_canal = 'push' then
    update carreras.suscripciones_alertas s
       set push_activado = false, actualizado_en = now()
     where s.user_id = p_user_id and s.push_activado;
    get diagnostics n = row_count;
  else
    return false;
  end if;
  return n > 0;
end
$$;
revoke all on function carreras.avisos_desactivar_canal(uuid, text) from public, anon, authenticated;
grant execute on function carreras.avisos_desactivar_canal(uuid, text) to service_role;

-- Mis avisos: desconectar Telegram (authenticated solo tiene SELECT en alertas_telegram).
create or replace function carreras.alertas_telegram_desconectar()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n int;
begin
  if auth.uid() is null then
    raise exception 'sin sesión' using errcode = '42501';
  end if;
  delete from carreras.alertas_telegram t where t.user_id = auth.uid();
  get diagnostics n = row_count;
  return n > 0;
end
$$;
revoke all on function carreras.alertas_telegram_desconectar() from public, anon;
grant execute on function carreras.alertas_telegram_desconectar() to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Vincular Telegram: un chat_id nulo no gasta el código ni devuelve true (lo encontró Carreras España).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function carreras.alertas_telegram_vincular(p_codigo text, p_chat_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  if p_codigo is null or p_chat_id is null or p_codigo !~ '^ca_[0-9a-f]{36}$' or p_chat_id <= 0 then
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
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) Purga de bajas a 30 días (portada de carreras_es.purgar_bajas) y del registro a 90 días.
-- ─────────────────────────────────────────────────────────────────────────────
alter table carreras.suscripciones_alertas add column if not exists purgado_en timestamptz;

create table if not exists carreras.purgas_bajas_log (
  id bigint generated always as identity primary key,
  creado_en timestamptz not null default now(),
  dias integer not null,
  candidatas integer not null,
  suscripciones_vaciadas integer not null,
  telegram_borrados integer not null,
  envios_borrados integer not null,
  tokens_borrados integer not null
);
alter table carreras.purgas_bajas_log enable row level security;
revoke all on table carreras.purgas_bajas_log from public, anon, authenticated;

create or replace function carreras.purgar_bajas(p_dias integer default 30)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_tg integer := 0;
  v_tg_resto integer := 0;
  v_sus integer := 0;
  v_env integer := 0;
  v_tok integer := 0;
begin
  if p_dias is null or p_dias < 30 then
    raise exception 'purgar_bajas: el plazo mínimo es 30 días';
  end if;

  select coalesce(array_agg(s.user_id), '{}')
    into v_ids
    from carreras.suscripciones_alertas s
   where s.baja_en is not null
     and s.baja_en < now() - make_interval(days => p_dias)
     and s.purgado_en is null;

  if cardinality(v_ids) > 0 then
    delete from carreras.alertas_telegram t where t.user_id = any (v_ids);
    get diagnostics v_tg = row_count;

    delete from carreras.avisos_envios e where e.user_id = any (v_ids);
    get diagnostics v_env = row_count;

    delete from carreras.avisos_baja_tokens k where k.user_id = any (v_ids);
    get diagnostics v_tok = row_count;

    -- Se conservan user_id y baja_en: con UNIQUE(user_id) la baja sigue siendo irreversible.
    update carreras.suscripciones_alertas s
       set email = 'baja@anonimo.invalid',
           correo_avisos = null,
           nombre = null,
           instagram = null,
           push_activado = false,
           consentimiento = false,
           consentimiento_en = null,
           origen = null,
           purgado_en = now(),
           actualizado_en = now()
     where s.user_id = any (v_ids);
    get diagnostics v_sus = row_count;
  end if;

  -- Por si acaso: ningún Telegram de una cuenta con baja (purgada o no) sobrevive a la pasada diaria.
  delete from carreras.alertas_telegram t
   using carreras.suscripciones_alertas s
   where s.user_id = t.user_id and s.baja_en is not null;
  get diagnostics v_tg_resto = row_count;
  v_tg := v_tg + v_tg_resto;

  insert into carreras.purgas_bajas_log (dias, candidatas, suscripciones_vaciadas, telegram_borrados, envios_borrados, tokens_borrados)
  values (p_dias, cardinality(v_ids), v_sus, v_tg, v_env, v_tok);

  return jsonb_build_object('candidatas', cardinality(v_ids), 'suscripciones_vaciadas', v_sus,
                            'telegram_borrados', v_tg, 'envios_borrados', v_env, 'tokens_borrados', v_tok);
end
$$;
revoke all on function carreras.purgar_bajas(integer) from public, anon, authenticated, service_role;

-- pg_cron (UTC): bajas 03:45 y registro + tokens caducados 03:55, después de los de carreras_es.
select cron.schedule('ca-purgar-bajas', '45 3 * * *', 'select carreras.purgar_bajas(30)');
select cron.schedule(
  'ca-purgar-avisos-envios',
  '55 3 * * *',
  $c$delete from carreras.avisos_envios where creado_en < now() - interval '90 days'; delete from carreras.avisos_baja_tokens where caduca_en < now() - interval '30 days'$c$
);
