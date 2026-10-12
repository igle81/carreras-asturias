-- Altas de avisos por correo. Distinto de carreras.vip_subscribers (canal VIP de pago, solo service_role).
-- Cada usuario autenticado solo lee e inserta su propia fila.

create table if not exists carreras.suscripciones_alertas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  origen text,
  creado_en timestamptz not null default now(),
  constraint suscripciones_alertas_user_unique unique (user_id),
  constraint suscripciones_alertas_email_len check (char_length(email) between 3 and 320),
  constraint suscripciones_alertas_origen_len check (origen is null or char_length(origen) <= 80)
);

create index if not exists suscripciones_alertas_creado_idx
  on carreras.suscripciones_alertas (creado_en desc);

alter table carreras.suscripciones_alertas enable row level security;

revoke all on table carreras.suscripciones_alertas from public, anon, authenticated;
grant select, insert on table carreras.suscripciones_alertas to authenticated;
grant all on table carreras.suscripciones_alertas to service_role;

drop policy if exists suscripciones_alertas_propias_leer on carreras.suscripciones_alertas;
create policy suscripciones_alertas_propias_leer
  on carreras.suscripciones_alertas
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists suscripciones_alertas_propias_crear on carreras.suscripciones_alertas;
create policy suscripciones_alertas_propias_crear
  on carreras.suscripciones_alertas
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

grant usage on schema carreras to anon, authenticated;

comment on table carreras.suscripciones_alertas is
  'Altas de avisos por correo (Supabase Auth, magic link). RLS: cada usuario solo lo suyo. No es vip_subscribers.';
