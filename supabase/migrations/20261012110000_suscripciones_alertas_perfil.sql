-- Nombre, Instagram opcional y si el alta activó el push de OneSignal.

alter table carreras.suscripciones_alertas
  add column if not exists nombre text,
  add column if not exists instagram text,
  add column if not exists push_activado boolean not null default false;

alter table carreras.suscripciones_alertas
  drop constraint if exists suscripciones_alertas_nombre_len;
alter table carreras.suscripciones_alertas
  add constraint suscripciones_alertas_nombre_len
  check (nombre is null or char_length(nombre) between 1 and 80);

alter table carreras.suscripciones_alertas
  drop constraint if exists suscripciones_alertas_instagram_fmt;
alter table carreras.suscripciones_alertas
  add constraint suscripciones_alertas_instagram_fmt
  check (instagram is null or instagram ~ '^@[A-Za-z0-9._]{1,30}$');

comment on column carreras.suscripciones_alertas.nombre is
  'Nombre que escribe la persona en /registro.';
comment on column carreras.suscripciones_alertas.instagram is
  'Usuario de Instagram normalizado (@handle). Null si no lo indica.';
comment on column carreras.suscripciones_alertas.push_activado is
  'True si, al confirmar, el navegador quedó vinculado en OneSignal con external_id = user_id.';

notify pgrst, 'reload schema';
