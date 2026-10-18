-- Ya aplicada en Supabase el 18-10-2026 (version 20261018124823). Copiada de supabase_migrations.schema_migrations.
create table if not exists carreras.avisos_envios (
  id bigint generated always as identity primary key,
  creado_en timestamptz not null default now(),
  aviso_key text not null,
  tipo text,
  id_canonico text,
  nombre text,
  user_id uuid,
  canal text not null check (canal in ('aviso','correo','push','telegram')),
  destino text,
  ok boolean not null default false,
  detalle text,
  prueba boolean not null default false,
  ejecucion text
);
comment on table carreras.avisos_envios is 'Registro de envíos de avisos por usuario y canal (n8n ile66X6k8jGcZIBO). Lo lee la vigilancia yI7G0BaEuGxqK9C3. Solo service_role.';
create index if not exists avisos_envios_creado_idx on carreras.avisos_envios (creado_en desc);
create index if not exists avisos_envios_dedup_idx on carreras.avisos_envios (aviso_key, user_id, canal);
alter table carreras.avisos_envios enable row level security;
revoke all on table carreras.avisos_envios from anon, authenticated, public;
grant select, insert on table carreras.avisos_envios to service_role;
