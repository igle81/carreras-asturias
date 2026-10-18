-- Aplicada en Supabase el 19-10-2026 a las 00:29 (hora de Madrid), version 20261018222953 (carreras_reactivar_sin_telegram). Después: get_advisors igual que antes (sin hallazgos nuevos).
-- Carreras Asturias · W1 de Calidad (revisión del #122), 19-10-2026. Solo esquema carreras.
-- Al volver a recibir avisos por correo, Telegram no vuelve sin pedirlo: avisos_reactivar_correo() borra
-- la conexión de Telegram de esa persona (la reconecta en Mis avisos si quiere).
-- La baja (Mis avisos o enlace del correo) borra ya en el momento la conexión de Telegram, en vez de esperar
-- a la pasada diaria de purgar_bajas. El efecto queda en consentimientos_log.detalle = 'telegram_desconectado'.
-- Compatible con el código de PRO: misma firma de las funciones; la columna nueva es opcional.

alter table carreras.consentimientos_log
  add column if not exists detalle text check (detalle is null or char_length(detalle) <= 80);

create or replace function carreras.suscripciones_alertas_a_log_consentimiento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_origen text := nullif(current_setting('carreras.consentimiento_origen', true), '');
  v_tg int := 0;
begin
  if tg_op = 'INSERT' then
    if new.baja_en is null and new.consentimiento then
      insert into carreras.consentimientos_log (user_id, accion, version, origen)
      values (new.user_id, 'alta', new.consentimiento_version, coalesce(v_origen, new.origen, 'web'));
    end if;
  elsif old.baja_en is null and new.baja_en is not null then
    -- La baja corta todos los canales en el momento, también Telegram.
    delete from carreras.alertas_telegram t where t.user_id = new.user_id;
    get diagnostics v_tg = row_count;
    insert into carreras.consentimientos_log (user_id, accion, version, origen, detalle)
    values (new.user_id, 'baja', old.consentimiento_version, coalesce(v_origen, 'mis_avisos'),
            case when v_tg > 0 then 'telegram_desconectado' end);
  elsif old.baja_en is not null and new.baja_en is null then
    -- Volver a recibir avisos es solo por correo: Telegram queda desconectado.
    delete from carreras.alertas_telegram t where t.user_id = new.user_id;
    get diagnostics v_tg = row_count;
    insert into carreras.consentimientos_log (user_id, accion, version, origen, detalle)
    values (new.user_id, 'reactivar', new.consentimiento_version, coalesce(v_origen, 'manual'),
            case when v_tg > 0 then 'telegram_desconectado' end);
  end if;
  return null;
end
$$;
revoke all on function carreras.suscripciones_alertas_a_log_consentimiento() from public, anon, authenticated;

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
  -- Telegram: lo borra el disparador del log al quitar la baja (y aquí, por si acaso, abajo).
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
    -- Al reactivar el correo no vuelve Telegram sin pedirlo (W1 de Calidad).
    delete from carreras.alertas_telegram where user_id = v_uid;
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
  'Mis avisos: deshace la baja de la persona con sesión (solo su fila, auth.uid()). Nuevo consentimiento con versión y registro en consentimientos_log; push apagado y Telegram desconectado.';
revoke all on function carreras.avisos_reactivar_correo() from public, anon;
grant execute on function carreras.avisos_reactivar_correo() to authenticated, service_role;
