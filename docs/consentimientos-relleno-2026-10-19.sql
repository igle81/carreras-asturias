-- Relleno inicial de carreras.consentimientos_log, ejecutado a mano (execute_sql, rol postgres) el
-- 19-10-2026 hacia las 00:27 (hora de Madrid), justo después de la migración 20261018222605.
-- Los user_id reales se han cambiado por los marcadores psql :'titular' y :'tercero' (WARN-2 de Seguridad).
-- NO volver a ejecutar: la migración 20261018224933_carreras_consentimientos_reconstruidos rehízo estas
-- 4 filas (reconstruido = true, detalle con la fuente y horas de servidor donde las hay).
begin;
insert into carreras.consentimientos_log (user_id, accion, version, origen, creado_en)
select s.user_id, 'alta', 'previa', 'backfill', s.consentimiento_en from carreras.suscripciones_alertas s
 where s.user_id in (:'titular',:'tercero')
   and not exists (select 1 from carreras.consentimientos_log c where c.user_id=s.user_id);
insert into carreras.consentimientos_log (user_id, accion, version, origen, creado_en) values
 (:'titular','baja','previa','backfill','2026-10-18 22:03:10+00'),
 (:'titular','reactivar','previa','manual_admin_peticion_titular',
  (select actualizado_en from carreras.suscripciones_alertas where user_id=:'titular'));
update carreras.suscripciones_alertas set consentimiento_version='previa' where user_id=:'titular';
commit;
