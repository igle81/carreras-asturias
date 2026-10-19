-- Aplicada en Supabase el 19-10-2026 a las 00:49 (hora de Madrid), version 20261018224933 (carreras_consentimientos_reconstruidos). Después: get_advisors sin hallazgos nuevos.
-- 19-10-2026 (WARN-2 de Seguridad): en este fichero los user_id reales se han cambiado por los marcadores psql
-- :'titular' y :'tercero'. Se aplicó con los valores reales el 19-10-2026 a las 00:49 (hora de Madrid) y
-- NO se debe volver a aplicar (Supabase la tiene registrada por versión 20261018224933; db push no la repite).
-- Son solo marcadores (psql no los sustituye dentro de DO $$): rehacerla en otra base exigiría cambiarlos a mano.
-- Carreras Asturias · C1–C3 y F1 de Seguridad (revisión de #123 y #124), 19-10-2026. Solo esquema carreras.
-- No toca carreras_es ni el Site URL. Compatible con el código de PRO (mismas firmas; columnas nuevas con valor por defecto).
set local lock_timeout = '5s';

-- ─────────────────────────────────────────────────────────────────────────────
-- C1) Las 4 filas rellenadas a mano el 19-10 (00:27 Madrid) se rehacen como «reconstruidas».
--     consentimientos_log es de solo inserción (el disparador consentimientos_log_solo_insercion
--     bloquea UPDATE y DELETE). Para corregir sin abrir la tabla: dentro de ESTA transacción se
--     desactiva solo ese disparador, se corrigen las 4 filas (por id y con la condición exacta del
--     relleno) y se vuelve a activar antes de terminar. Si algo falla, la transacción entera se deshace
--     y el disparador sigue activo. Nadie más puede escribir mientras: ALTER TABLE toma un bloqueo
--     ACCESS EXCLUSIVE sobre la tabla hasta el commit.
--     Fuentes (comprobadas el 19-10 a las 00:50 Madrid):
--       · alta: suscripciones_alertas.creado_en (default now() del servidor).
--       · baja del titular: edge_logs de Supabase, PATCH 204 a suscripciones_alertas del titular desde su
--         navegador a las 2026-10-18 22:03:10.482 UTC (la baja de Mis avisos; el baja_en original se perdió
--         al reactivar).
--       · reactivación del titular: no hay traza de servidor (la SQL de administración no queda en los logs).
--         Se deja actualizado_en (2026-10-18 22:06:57.865 UTC), que es APROXIMADA: es una columna que también
--         escribe el cliente. Es coherente con el chat (Javier lo pidió a las 00:06 Madrid) y con edge_logs
--         (ninguna escritura del navegador en esa fila entre 22:05:55 y 22:07:33 UTC).
-- ─────────────────────────────────────────────────────────────────────────────
alter table carreras.consentimientos_log
  add column if not exists reconstruido boolean not null default false;
comment on column carreras.consentimientos_log.reconstruido is
  'true = fila rehecha después del hecho a partir de otras fuentes (ver detalle), no escrita en el momento.';

alter table carreras.consentimientos_log disable trigger consentimientos_log_solo_insercion;

do $$
declare
  n int;
  t int := 0;
begin
  update carreras.consentimientos_log c
     set creado_en = s.creado_en,
         origen = 'web',
         version = 'previa',
         reconstruido = true,
         detalle = 'reconstruido: hora = suscripciones_alertas.creado_en (servidor)'
    from carreras.suscripciones_alertas s
   where s.user_id = c.user_id
     and c.accion = 'alta' and c.origen = 'backfill' and c.reconstruido = false
     and c.user_id in (:'titular', :'tercero');
  get diagnostics n = row_count; t := t + n;

  update carreras.consentimientos_log c
     set creado_en = '2026-10-18 22:03:10.482+00',
         origen = 'mis_avisos',
         reconstruido = true,
         detalle = 'reconstruido: edge_logs PATCH 204 del titular 22:03:10.482 UTC'
   where c.user_id = :'titular'
     and c.accion = 'baja' and c.origen = 'backfill' and c.reconstruido = false;
  get diagnostics n = row_count; t := t + n;

  update carreras.consentimientos_log c
     set reconstruido = true,
         detalle = 'reconstruido: hora aprox. = actualizado_en (lo puede escribir el cliente)'
   where c.user_id = :'titular'
     and c.accion = 'reactivar' and c.origen = 'manual_admin_peticion_titular' and c.reconstruido = false;
  get diagnostics n = row_count; t := t + n;

  if t <> 4 then
    raise exception 'C1: se esperaban 4 filas rellenadas y hay %', t;
  end if;
end
$$;

alter table carreras.consentimientos_log enable trigger consentimientos_log_solo_insercion;

-- ─────────────────────────────────────────────────────────────────────────────
-- C3) El origen no viene del navegador: lista cerrada en el log y 'web' fijo en el alta del cliente.
-- ─────────────────────────────────────────────────────────────────────────────
alter table carreras.consentimientos_log
  drop constraint if exists consentimientos_log_origen_lista;
alter table carreras.consentimientos_log
  add constraint consentimientos_log_origen_lista
  check (origen is null or origen in ('web', 'mis_avisos', 'enlace_correo', 'mis_avisos_reactivar',
                                       'manual', 'manual_admin_peticion_titular'));

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
      new.origen := 'web';                    -- C3: el origen no lo decide el navegador
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
      -- C3: el alta siempre es 'web' salvo que una función del servidor fije otro origen.
      insert into carreras.consentimientos_log (user_id, accion, version, origen)
      values (new.user_id, 'alta', new.consentimiento_version, coalesce(v_origen, 'web'));
    end if;
  elsif old.baja_en is null and new.baja_en is not null then
    delete from carreras.alertas_telegram t where t.user_id = new.user_id;
    get diagnostics v_tg = row_count;
    insert into carreras.consentimientos_log (user_id, accion, version, origen, detalle)
    values (new.user_id, 'baja', old.consentimiento_version, coalesce(v_origen, 'mis_avisos'),
            case when v_tg > 0 then 'telegram_desconectado' end);
  elsif old.baja_en is not null and new.baja_en is null then
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

-- ─────────────────────────────────────────────────────────────────────────────
-- F1) Tope de tamaño de los filtros (4 KB).
-- ─────────────────────────────────────────────────────────────────────────────
alter table carreras.suscripciones_alertas
  drop constraint if exists suscripciones_alertas_filtros_avisos_validos;
alter table carreras.suscripciones_alertas
  add constraint suscripciones_alertas_filtros_avisos_validos
  check (octet_length(filtros_avisos::text) <= 4096 and carreras.filtros_avisos_validos(filtros_avisos));

-- ─────────────────────────────────────────────────────────────────────────────
-- Info) La purga también vacía los filtros. Resto igual que en 20261018222605.
-- ─────────────────────────────────────────────────────────────────────────────
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
    -- solo se recupera el correo de su cuenta (nombre, Instagram y filtros no).
    update carreras.suscripciones_alertas s
       set email = 'baja@anonimo.invalid',
           correo_avisos = null,
           nombre = null,
           instagram = null,
           push_activado = false,
           consentimiento = false,
           consentimiento_en = null,
           consentimiento_version = null,
           filtros_avisos = '{}'::jsonb,
           origen = null,
           purgado_en = now(),
           actualizado_en = now()
     where s.user_id = any (v_ids);
    get diagnostics v_sus = row_count;
  end if;

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
  'Vacía las bajas de más de p_dias (mín. 30): correo, nombre, Instagram, filtros, Telegram, envíos, tokens y consentimientos_log. La persona puede volver con avisos_reactivar_correo (solo se recupera el correo de la cuenta).';
revoke all on function carreras.purgar_bajas(integer) from public, anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tipos de aviso nuevos (decisión de Javier, 19-10): un tipo que la persona no ha podido elegir se recibe,
-- igual que «dato que falta = llega». avisos_evento_pasa_filtros ya lo hace (v_tipo null → no corta);
-- se deja escrito en su comentario.
-- ─────────────────────────────────────────────────────────────────────────────
comment on function carreras.avisos_evento_pasa_filtros(jsonb, text, text) is
  'Filtros de Mis avisos. {} o tipo prueba = pasa. Dato que falta en la carrera = pasa. Tipo de aviso que no es apertura (vispera/dia) ni clasificaciones (clasif*) = pasa: la persona no ha podido elegirlo.';
