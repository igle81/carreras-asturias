-- Aplicada en Supabase el 19-10-2026 a las 00:53 (hora de Madrid), version 20261018225338 (carreras_filtros_modalidad_por_deporte). Después: get_advisors sin hallazgos nuevos.
-- Carreras Asturias · W1 de Calidad (revisión del #124), 19-10-2026. Solo esquema carreras.
-- La modalidad se filtra por separado para cada deporte: claves modalidad_pie y modalidad_ciclismo
-- (sustituyen a modalidad). Marcar «Trail» y nada de ciclismo ya no corta el ciclismo: si no hay
-- modalidades de ciclismo marcadas, el ciclismo llega entero (salvo que el filtro «deporte» lo excluya).
-- Hoy ninguna fila tiene filtros (comprobado antes de aplicar), así que no hay datos que migrar;
-- si alguna tuviera la clave antigua «modalidad», el CHECK nuevo haría fallar la migración entera.
-- Compatible con el código de PRO (PRO aún no tiene la tarjeta de filtros). Firmas sin cambios.
set local lock_timeout = '5s';

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
        where k not in ('deporte', 'modalidad_pie', 'modalidad_ciclismo', 'concejo', 'tipo', 'distancia')
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
                 or (e.key in ('modalidad_pie', 'modalidad_ciclismo') and (v #>> '{}') !~ '^[a-z_]{2,40}$')
           )
     )
$$;
revoke all on function carreras.filtros_avisos_validos(jsonb) from public, anon;
grant execute on function carreras.filtros_avisos_validos(jsonb) to authenticated, service_role;

-- Volver a validar las filas con la función nueva (el CHECK usa la función; se recrea para que se compruebe ahora).
alter table carreras.suscripciones_alertas
  drop constraint if exists suscripciones_alertas_filtros_avisos_validos;
alter table carreras.suscripciones_alertas
  add constraint suscripciones_alertas_filtros_avisos_validos
  check (octet_length(filtros_avisos::text) <= 4096 and carreras.filtros_avisos_validos(filtros_avisos));

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

  -- tipo de aviso (un tipo que no es apertura ni clasificaciones pasa: no se ha podido elegir)
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

  -- modalidad: solo la lista del deporte de la carrera (W1)
  if e.modalidad in ('pie', 'ciclismo') and e.disciplina_normalizada is not null then
    lista := array(select jsonb_array_elements_text(coalesce(f -> ('modalidad_' || e.modalidad), '[]')));
    if cardinality(lista) > 0 and not (e.disciplina_normalizada = any (lista)) then
      return false;
    end if;
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
comment on function carreras.avisos_evento_pasa_filtros(jsonb, text, text) is
  'Filtros de Mis avisos. {} o tipo prueba = pasa. Dato que falta en la carrera = pasa. Tipo de aviso que no es apertura (vispera/dia) ni clasificaciones (clasif*) = pasa: la persona no ha podido elegirlo. Modalidad por deporte (modalidad_pie / modalidad_ciclismo).';
