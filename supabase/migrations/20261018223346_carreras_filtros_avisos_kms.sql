-- Aplicada en Supabase el 19-10-2026 a las 00:33 (hora de Madrid), version 20261018223346 (carreras_filtros_avisos_kms). Después: get_advisors sin hallazgos nuevos.
-- Arreglo de carreras.evento_kms (19-10-2026): substring con grupo de captura devolvía el decimal, no el número; ahora (?:…).
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
                 then replace(substring(x #>> '{}' from '[0-9]+(?:[.,][0-9]+)?'), ',', '.')::numeric
             end as k
        from jsonb_array_elements(
               case jsonb_typeof(p) when 'array' then p when 'string' then jsonb_build_array(p) else '[]'::jsonb end
             ) x
    ) z
$$;
revoke all on function carreras.evento_kms(jsonb) from public, anon, authenticated;
grant execute on function carreras.evento_kms(jsonb) to service_role;
