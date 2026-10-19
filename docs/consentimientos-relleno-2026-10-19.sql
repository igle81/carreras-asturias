-- Relleno inicial de carreras.consentimientos_log, ejecutado a mano (execute_sql, rol postgres) el
-- 19-10-2026 hacia las 00:27 (hora de Madrid), justo después de la migración 20261018222605.
-- NO volver a ejecutar: la migración 20261018224933_carreras_consentimientos_reconstruidos rehízo estas
-- 4 filas (reconstruido = true, detalle con la fuente y horas de servidor donde las hay).
begin;
insert into carreras.consentimientos_log (user_id, accion, version, origen, creado_en)
select s.user_id, 'alta', 'previa', 'backfill', s.consentimiento_en from carreras.suscripciones_alertas s
 where s.user_id in ('6e0f70d1-854d-4891-be17-b93484c6877c','518c6251-fe63-4fd0-8126-12f9d76f38f3')
   and not exists (select 1 from carreras.consentimientos_log c where c.user_id=s.user_id);
insert into carreras.consentimientos_log (user_id, accion, version, origen, creado_en) values
 ('6e0f70d1-854d-4891-be17-b93484c6877c','baja','previa','backfill','2026-10-18 22:03:10+00'),
 ('6e0f70d1-854d-4891-be17-b93484c6877c','reactivar','previa','manual_admin_peticion_titular',
  (select actualizado_en from carreras.suscripciones_alertas where user_id='6e0f70d1-854d-4891-be17-b93484c6877c'));
update carreras.suscripciones_alertas set consentimiento_version='previa' where user_id='6e0f70d1-854d-4891-be17-b93484c6877c';
commit;
