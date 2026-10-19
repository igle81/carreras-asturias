-- Aplicada en Supabase el 19-10-2026 a las 00:11 (hora de Madrid), version 20261018221141. Después: get_advisors sin hallazgos nuevos en carreras.
-- Carreras Asturias · Mis avisos: volver a recibir avisos por correo tras una baja (19-10-2026).
-- Javier pidió poder deshacer la baja desde Mis avisos, con la sesión iniciada y solo para la propia fila.
-- El disparador suscripciones_alertas_a_proteger_baja sigue impidiendo que authenticated/anon quiten
-- baja_en con un UPDATE directo; esta función SECURITY DEFINER es la única vía y exige auth.uid().
-- Solo esquema carreras. No toca carreras_es ni el Site URL.

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

  -- Correo confirmado de la cuenta (avisos_destinatarios exige correo_avisos = correo de Auth).
  select lower(btrim(u.email))
    into v_email
    from auth.users u
   where u.id = v_uid
     and u.email_confirmed_at is not null
     and u.deleted_at is null;
  if v_email is null then
    return false;
  end if;

  -- Nuevo consentimiento explícito (el clic en el botón). Si la purga ya vació la fila,
  -- se rellena con el correo de la cuenta; nombre e Instagram no se recuperan.
  -- push_activado no se toca: sigue en false hasta que la persona lo active en cada móvil.
  update carreras.suscripciones_alertas s
     set baja_en = null,
         purgado_en = null,
         consentimiento = true,
         consentimiento_en = now(),
         email = case when s.purgado_en is not null then v_email else s.email end,
         correo_avisos = case
           when s.purgado_en is not null or s.correo_avisos is null then v_email
           else s.correo_avisos
         end,
         actualizado_en = now()
   where s.user_id = v_uid
     and s.baja_en is not null;
  get diagnostics n = row_count;

  if n > 0 then
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
  'Mis avisos: deshace la baja de la persona con sesión (solo su fila, auth.uid()). Nuevo consentimiento; push sigue apagado.';

revoke all on function carreras.avisos_reactivar_correo() from public, anon;
grant execute on function carreras.avisos_reactivar_correo() to authenticated, service_role;
