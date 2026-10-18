-- Aplicada en Supabase el 19-10-2026 a las 00:33 (hora de Madrid), version 20261018223301 (carreras_filtros_avisos). Después: get_advisors sin hallazgos nuevos.
-- Carreras Asturias · filtros de avisos en Mis avisos (Javier, 19-10-2026). Solo esquema carreras.
-- Cada persona elige qué avisos recibe. Sin filtros ('{}') recibe todo, como hasta ahora.
-- Filtros (claves opcionales; lista vacía o ausente = todo):
--   deporte    : valores de carreras.eventos.modalidad (pie, ciclismo)
--   modalidad  : valores de carreras.eventos.disciplina_normalizada (trail, asfalto, mtb…)
--   concejo    : valores de carreras.eventos.municipio (como el selector de concejo de la web)
--   tipo       : apertura (avisos vispera/dia) y clasificaciones (clasif, clasif_sin_resultado)
--   distancia  : corta (< 10 km), media (10–21,1 km), larga (> 21,1 km); solo carreras a pie
-- Si a una carrera le falta el dato del filtro (null), el aviso llega igual: no se pierde ninguno por falta de datos.
-- n8n (ile66X6k8jGcZIBO) lee avisos_destinatarios_filtrados(p_avisos) en vez de avisos_destinatarios().
-- avisos_destinatarios() no cambia. Compatible con el código de PRO (columna nueva con valor por defecto).

create or replace function carreras.filtros_avisos_validos(f jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select f is not null
     and jsonb_typeof(f) = 'object'
     and not exists (
       select 1 from jsonb_object_keys(f) k
        where k not in ('deporte', 'modalidad', 'concejo', 'tipo', 'distancia')
     )
     and not exists (
       select 1 from jsonb_each(f) e
        where jsonb_typeof(e.value) <> 'array'
           or jsonb_array_length(e.value) > 60
           or exists (
             select 1 from jsonb_array_elements(e.value) v
              where jsonb_typeof(v) <> 'string'
                 or char_length(v #>> '{}') not between 1 and 80
                 or (e.key = 'deporte' and (v #>> '{}') not in ('pie', 'ciclismo'))
                 or (e.key = 'tipo' and (v #>> '{}') not in ('apertura', 'clasificaciones'))
                 or (e.key = 'distancia' and (v #>> '{}') not in ('corta', 'media', 'larga'))
                 or (e.key = 'modalidad' and (v #>> '{}') !~ '^[a-z_]{2,40}$')
           )
     )
$$;
revoke all on function carreras.filtros_avisos_validos(jsonb) from public, anon;
grant execute on function carreras.filtros_avisos_validos(jsonb) to authenticated, service_role;

alter table carreras.suscripciones_alertas
  add column if not exists filtros_avisos jsonb not null default '{}'::jsonb;
alter table carreras.suscripciones_alertas
  drop constraint if exists suscripciones_alertas_filtros_avisos_validos;
alter table carreras.suscripciones_alertas
  add constraint suscripciones_alertas_filtros_avisos_validos
  check (carreras.filtros_avisos_validos(filtros_avisos));
comment on column carreras.suscripciones_alertas.filtros_avisos is
  'Qué avisos quiere recibir (deporte, modalidad, concejo, tipo, distancia). {} = todos. Lo cambia la persona en Mis avisos.';

-- La persona cambia sus filtros desde Mis avisos (la política de UPDATE ya limita a su propia fila).
grant update (filtros_avisos) on carreras.suscripciones_alertas to authenticated;

-- Distancias en km de un evento (array [{km}] o texto tipo «10k»).
create or replace function carreras.evento_kms(p jsonb)
returns numeric[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(k) filter (where k is not null and k > 0), '{}')
    from (
      select case
               when jsonb_typeof(x) = 'object' and jsonb_typeof(x -> 'km') = 'number' then (x ->> 'km')::numeric
               when jsonb_typeof(x) = 'string' and (x #>> '{}') ~ '^\s*[0-9]+([.,][0-9]+)?\s*(k|km)\s*$'
                 then replace(substring(x #>> '{}' from '[0-9]+([.,][0-9]+)?'), ',', '.')::numeric
             end as k
        from jsonb_array_elements(
               case jsonb_typeof(p) when 'array' then p when 'string' then jsonb_build_array(p) else '[]'::jsonb end
             ) x
    ) z
$$;
revoke all on function carreras.evento_kms(jsonb) from public, anon, authenticated;
grant execute on function carreras.evento_kms(jsonb) to service_role;

create or replace function carreras.avisos_evento_pasa_filtros(f jsonb, p_tipo text, p_id_canonico text)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  e record;
  v_tipo text;
  v_kms numeric[];
  lista text[];
begin
  if f is null or f = '{}'::jsonb or p_tipo = 'prueba' then
    return true;
  end if;

  -- tipo de aviso
  lista := array(select jsonb_array_elements_text(coalesce(f -> 'tipo', '[]')));
  if cardinality(lista) > 0 then
    v_tipo := case
                when p_tipo in ('vispera', 'dia') then 'apertura'
                when p_tipo like 'clasif%' then 'clasificaciones'
              end;
    if v_tipo is not null and not (v_tipo = any (lista)) then
      return false;
    end if;
  end if;

  if p_id_canonico is null then
    return true;
  end if;
  select ev.modalidad, ev.disciplina_normalizada, ev.municipio, ev.municipio_meta, ev.distancias
    into e
    from carreras.eventos ev
   where ev.id_canonico = p_id_canonico;
  if not found then
    return true;
  end if;

  lista := array(select jsonb_array_elements_text(coalesce(f -> 'deporte', '[]')));
  if cardinality(lista) > 0 and e.modalidad is not null and not (e.modalidad = any (lista)) then
    return false;
  end if;

  lista := array(select jsonb_array_elements_text(coalesce(f -> 'modalidad', '[]')));
  if cardinality(lista) > 0 and e.disciplina_normalizada is not null
     and not (e.disciplina_normalizada = any (lista)) then
    return false;
  end if;

  lista := array(select lower(btrim(x)) from jsonb_array_elements_text(coalesce(f -> 'concejo', '[]')) x);
  if cardinality(lista) > 0 and coalesce(e.municipio, e.municipio_meta) is not null
     and not (lower(btrim(coalesce(e.municipio, ''))) = any (lista)
              or lower(btrim(coalesce(e.municipio_meta, ''))) = any (lista)) then
    return false;
  end if;

  lista := array(select jsonb_array_elements_text(coalesce(f -> 'distancia', '[]')));
  if cardinality(lista) > 0 and e.modalidad is distinct from 'ciclismo' then
    v_kms := carreras.evento_kms(e.distancias);
    if cardinality(v_kms) > 0 and not exists (
      select 1 from unnest(v_kms) k
       where ('corta' = any (lista) and k < 10)
          or ('media' = any (lista) and k >= 10 and k <= 21.1)
          or ('larga' = any (lista) and k > 21.1)
    ) then
      return false;
    end if;
  end if;

  return true;
end
$$;
revoke all on function carreras.avisos_evento_pasa_filtros(jsonb, text, text) from public, anon, authenticated;
grant execute on function carreras.avisos_evento_pasa_filtros(jsonb, text, text) to service_role;

-- n8n: los mismos destinatarios que avisos_destinatarios(), con la lista de avisos (key) que cada uno acepta.
-- p_avisos = [{"key": "...", "tipo": "vispera|dia|clasif|…", "id_canonico": "..."}]
create or replace function carreras.avisos_destinatarios_filtrados(p_avisos jsonb default '[]'::jsonb)
returns table (user_id uuid, correo text, push_activado boolean, chat_id bigint, avisos text[])
language sql
stable
security definer
set search_path = ''
as $$
  select d.user_id, d.correo, d.push_activado, d.chat_id,
         coalesce(array(
           select a ->> 'key'
             from jsonb_array_elements(case when jsonb_typeof(p_avisos) = 'array' then p_avisos else '[]'::jsonb end) a
            where a ->> 'key' is not null
              and carreras.avisos_evento_pasa_filtros(s.filtros_avisos, a ->> 'tipo', a ->> 'id_canonico')
         ), '{}')
    from carreras.avisos_destinatarios() d
    join carreras.suscripciones_alertas s on s.user_id = d.user_id
$$;
revoke all on function carreras.avisos_destinatarios_filtrados(jsonb) from public, anon, authenticated;
grant execute on function carreras.avisos_destinatarios_filtrados(jsonb) to service_role;
