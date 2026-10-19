-- Aplicada en Supabase el 19-10-2026 a las 00:26 (hora de Madrid), version 20261018222605 (carreras_consentimientos_log). Después: get_advisors sin hallazgos nuevos salvo el INFO esperado «RLS sin políticas» en carreras.consentimientos_log (acceso solo por disparador).
-- Backfill aparte (no forma parte de la migración): alta 'previa' de las 2 filas existentes; para el titular, baja 18-10 22:03:10 UTC y reactivar manual_admin_peticion_titular 22:06:57 UTC.
-- Carreras Asturias · registro de consentimientos (R1-R3 de Seguridad, AVISOS-REALES-2026-10-18.md), 19-10-2026.
-- Solo esquema carreras. No toca carreras_es ni el Site URL.
--  R1: carreras.consentimientos_log (solo inserción) + suscripciones_alertas.consentimiento_version.
--      Nadie del cliente escribe en el log: lo rellena un disparador SECURITY DEFINER al dar de alta,
--      dar de baja (Mis avisos o enlace del correo) y reactivar. Se borra con purgar_bajas y con la cuenta.
--  R2: purgar_bajas ya no dice que la baja sea irreversible.
--  R3: avisos_baja_por_token también da de baja con un token usado pero vigente si la fila está activa.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Versión vigente del texto de Privacidad (igual que PRIVACIDAD_VERSION en lib/legal.ts; lo comprueba un test).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function carreras.consentimiento_version_vigente()
returns text
language sql
immutable
set search_path = ''
as $$ select '2026-10-19'::text $$;
revoke all on function carreras.consentimiento_version_vigente() from public, anon, authenticated;
grant execute on function carreras.consentimiento_version_vigente() to service_role;

alter table carreras.suscripciones_alertas
  add column if not exists consentimiento_version text;
alter table carreras.suscripciones_alertas
  drop constraint if exists suscripciones_alertas_consentimiento_version_fmt;
alter table carreras.suscripciones_alertas
  add constraint suscripciones_alertas_consentimiento_version_fmt
  check (consentimiento_version is null or consentimiento_version ~ '^([0-9]{4}-[0-9]{2}-[0-9]{2}|previa)$');
comment on column carreras.suscripciones_alertas.consentimiento_version is
  'Versión (fecha) del texto de Privacidad aceptado en el alta o al reactivar. «previa» = anterior al registro de consentimientos.';

-- El alta del cliente puede mandar la columna, pero el disparador fija siempre la versión vigente.
grant insert (consentimiento_version) on carreras.suscripciones_alertas to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Registro de solo inserción.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists carreras.consentimientos_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  accion text not null check (accion in ('alta', 'baja', 'reactivar')),
  version text check (version is null or version ~ '^([0-9]{4}-[0-9]{2}-[0-9]{2}|previa)$'),
  origen text check (origen is null or char_length(origen) <= 80),
  creado_en timestamptz not null default now()
);
comment on table carreras.consentimientos_log is
  'Prueba de alta, baja y reactivación de los avisos (RGPD art. 7.1). Solo inserción vía disparador. Se borra con purgar_bajas y con la cuenta (ON DELETE CASCADE).';
create index if not exists consentimientos_log_user_idx on carreras.consentimientos_log (user_id, creado_en);
alter table carreras.consentimientos_log enable row level security;
revoke all on table carreras.consentimientos_log from public, anon, authenticated, service_role;

-- Ni UPDATE nunca, ni DELETE desde los roles del cliente (la purga y el borrado de cuenta sí borran).
create or replace function carreras.consentimientos_log_solo_insercion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'consentimientos_log es de solo inserción' using errcode = '42501';
  end if;
  if current_user in ('authenticated', 'anon') then
    raise exception 'consentimientos_log es de solo inserción' using errcode = '42501';
  end if;
  return old;
end
$$;
revoke all on function carreras.consentimientos_log_solo_insercion() from public, anon, authenticated;

drop trigger if exists consentimientos_log_solo_insercion on carreras.consentimientos_log;
create trigger consentimientos_log_solo_insercion
  before update or delete on carreras.consentimientos_log
  for each row execute function carreras.consentimientos_log_solo_insercion();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) La versión en el alta del cliente (se añade al disparador que ya protege la baja; el resto igual).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function carreras.suscripciones_alertas_a_proteger_baja()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Solo restringe a los roles del cliente; postgres, service_role y cron escriben libre.
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.baja_en := null;
      new.consentimiento_en := now();
      new.consentimiento_version := carreras.consentimiento_version_vigente();
    else
      if old.baja_en is not null then
        new.baja_en := old.baja_en;           -- el cliente no quita la baja: solo avisos_reactivar_correo()
      elsif new.baja_en is not null then
        new.baja_en := now();                 -- hora del servidor
        new.push_activado := false;
      end if;
      if old.baja_en is not null then
        new.push_activado := false;           -- tras la baja no se reactiva el push
      end if;
    end if;
  end if;
  return new;
end
$$;
revoke execute on function carreras.suscripciones_alertas_a_proteger_baja() from public, anon, authenticated;
-- consentimiento_version_vigente la llama el disparador como authenticated (security invoker).
grant execute on function carreras.consentimiento_version_vigente() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) El disparador que escribe el log (después de proteger_baja, con los valores finales).
--    origen: el de la fila en el alta; en baja/reactivar, el que fije la función con
--    set_config('carreras.consentimiento_origen', ...), o 'mis_avisos' si viene del cliente.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function carreras.suscripciones_alertas_a_log_consentimiento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_origen text := nullif(current_setting('carreras.consentimiento_origen', true), '');
begin
  if tg_op = 'INSERT' then
    if new.baja_en is null and new.consentimiento then
      insert into carreras.consentimientos_log (user_id, accion, version, origen)
      values (new.user_id, 'alta', new.consentimiento_version, coalesce(v_origen, new.origen, 'web'));
    end if;
  elsif old.baja_en is null and new.baja_en is not null then
    insert into carreras.consentimientos_log (user_id, accion, version, origen)
    values (new.user_id, 'baja', old.consentimiento_version, coalesce(v_origen, 'mis_avisos'));
  elsif old.baja_en is not null and new.baja_en is null then
    insert into carreras.consentimientos_log (user_id, accion, version, origen)
    values (new.user_id, 'reactivar', new.consentimiento_version, coalesce(v_origen, 'manual'));
  end if;
  return null;
end
$$;
revoke all on function carreras.suscripciones_alertas_a_log_consentimiento() from public, anon, authenticated;

drop trigger if exists suscripciones_alertas_b_log_consentimiento on carreras.suscripciones_alertas;
create trigger suscripciones_alertas_b_log_consentimiento
  after insert or update of baja_en on carreras.suscripciones_alertas
  for each row execute function carreras.suscripciones_alertas_a_log_consentimiento();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) Reactivar: rellena la versión y marca el origen (misma firma, sin parámetros, solo auth.uid()).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function carreras.avisos_reactivar_correo()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  n int := 0;
begin
  if v_uid is null then
    raise exception 'sin sesión' using errcode = '42501';
  end if;

  select lower(btrim(u.email))
    into v_email
    from auth.users u
   where u.id = v_uid
     and u.email_confirmed_at is not null
     and u.deleted_at is null;
  if v_email is null then
    return false;
  end if;

  perform set_config('carreras.consentimiento_origen', 'mis_avisos_reactivar', true);

  -- Nuevo consentimiento explícito (el clic en el botón). Si la purga ya vació la fila,
  -- se rellena con el correo de la cuenta; nombre e Instagram no se recuperan.
  -- push_activado no se toca: sigue en false hasta que la persona lo active en cada móvil.
  update carreras.suscripciones_alertas s
     set baja_en = null,
         purgado_en = null,
         consentimiento = true,
         consentimiento_en = now(),
         consentimiento_version = carreras.consentimiento_version_vigente(),
         email = case when s.purgado_en is not null then v_email else s.email end,
         correo_avisos = case
           when s.purgado_en is not null or s.correo_avisos is null then v_email
           else s.correo_avisos
         end,
         actualizado_en = now()
   where s.user_id = v_uid
     and s.baja_en is not null;
  get diagnostics n = row_count;

  perform set_config('carreras.consentimiento_origen', '', true);

  if n > 0 then
    -- Los enlaces de baja de correos anteriores, aún sin caducar, vuelven a servir para darse de baja.
    update carreras.avisos_baja_tokens t
       set usado_en = null
     where t.user_id = v_uid
       and t.caduca_en > now();
  end if;
  return n > 0;
end
$$;
comment on function carreras.avisos_reactivar_correo() is
  'Mis avisos: deshace la baja de la persona con sesión (solo su fila, auth.uid()). Nuevo consentimiento con versión y registro en consentimientos_log; push sigue apagado.';
revoke all on function carreras.avisos_reactivar_correo() from public, anon;
grant execute on function carreras.avisos_reactivar_correo() to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6) Baja por token (R3): un token usado pero vigente también da de baja si la fila está activa
--    (p. ej. tras una reactivación hecha fuera de la RPC). Respuesta igual: solo true/false.
-- ─────────────────────────────────────────────────────────────────────────────
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
  if v_caduca < now() then
    -- caducado: idempotente si ya se usó, si no, no vale
    return v_usado is not null;
  end if;
  if v_usado is not null and not exists (
    select 1 from carreras.suscripciones_alertas s
     where s.user_id = v_user and s.baja_en is null
  ) then
    return true;
  end if;

  perform set_config('carreras.consentimiento_origen', 'enlace_correo', true);
  update carreras.suscripciones_alertas s
     set baja_en = coalesce(s.baja_en, now()),
         push_activado = false,
         actualizado_en = now()
   where s.user_id = v_user;
  perform set_config('carreras.consentimiento_origen', '', true);
  delete from carreras.alertas_telegram t where t.user_id = v_user;
  -- todos los tokens de esa persona quedan usados (la baja corta todos los canales)
  update carreras.avisos_baja_tokens t
     set usado_en = coalesce(t.usado_en, now())
   where t.user_id = v_user;
  return true;
end
$$;
revoke all on function carreras.avisos_baja_por_token(text) from public, anon, authenticated;
grant execute on function carreras.avisos_baja_por_token(text) to anon, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7) Purga (R2): borra también el log de consentimientos y vacía la versión. Comentario corregido.
-- ─────────────────────────────────────────────────────────────────────────────
alter table carreras.purgas_bajas_log
  add column if not exists consentimientos_borrados integer not null default 0;

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
  v_con integer := 0;
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

    delete from carreras.consentimientos_log c where c.user_id = any (v_ids);
    get diagnostics v_con = row_count;

    -- Se conservan user_id y baja_en para no volver a enviar avisos (UNIQUE(user_id): no se crea otra fila).
    -- La baja no es irreversible: la persona puede volver con avisos_reactivar_correo(), y entonces
    -- solo se recupera el correo de su cuenta (nombre e Instagram no).
    update carreras.suscripciones_alertas s
       set email = 'baja@anonimo.invalid',
           correo_avisos = null,
           nombre = null,
           instagram = null,
           push_activado = false,
           consentimiento = false,
           consentimiento_en = null,
           consentimiento_version = null,
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

  insert into carreras.purgas_bajas_log (dias, candidatas, suscripciones_vaciadas, telegram_borrados, envios_borrados, tokens_borrados, consentimientos_borrados)
  values (p_dias, cardinality(v_ids), v_sus, v_tg, v_env, v_tok, v_con);

  return jsonb_build_object('candidatas', cardinality(v_ids), 'suscripciones_vaciadas', v_sus,
                            'telegram_borrados', v_tg, 'envios_borrados', v_env, 'tokens_borrados', v_tok,
                            'consentimientos_borrados', v_con);
end
$$;
comment on function carreras.purgar_bajas(integer) is
  'Vacía las bajas de más de p_dias (mín. 30): correo, nombre, Instagram, Telegram, envíos, tokens y consentimientos_log. La persona puede volver con avisos_reactivar_correo (solo se recupera el correo de la cuenta).';
revoke all on function carreras.purgar_bajas(integer) from public, anon, authenticated, service_role;
