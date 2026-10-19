-- carreras.suscripciones_alertas: grants por columna + baja irreversible (18-10-2026)
revoke insert, update on table carreras.suscripciones_alertas from public, anon, authenticated;

grant insert (user_id, email, nombre, instagram, correo_avisos, consentimiento,
              consentimiento_en, push_activado, origen)
  on carreras.suscripciones_alertas to authenticated;
grant update (push_activado, baja_en, actualizado_en)
  on carreras.suscripciones_alertas to authenticated;

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
    else
      if old.baja_en is not null then
        new.baja_en := old.baja_en;           -- la baja no se puede deshacer
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

drop trigger if exists suscripciones_alertas_a_proteger_baja on carreras.suscripciones_alertas;
create trigger suscripciones_alertas_a_proteger_baja
  before insert or update on carreras.suscripciones_alertas
  for each row execute function carreras.suscripciones_alertas_a_proteger_baja();
