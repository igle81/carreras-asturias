-- Aplicada en Supabase el 18-10-2026 (version 20261018133451, carreras_telegram_desvincular).
-- Carreras Asturias · /stop y /baja de @AvilesIA_bot (Seguridad punto 4 / B7, 18-10-2026).
-- Contrato: docs/telegram-bot-padre.md de igle81/alquileres-aviles (rama telegram-b5-b7-stop, 3eff29e).
-- El webhook del bot (Alquileres) llama con la clave publicable (rol anon) y la cabecera x-ca-webhook = CA_WEBHOOK_SECRETO.
-- El secreto se guarda en Vault con el nombre 'ca_webhook_secreto' (paso manual, el valor nunca va a git):
--   select vault.create_secret('<SECRETO>', 'ca_webhook_secreto', 'Cabecera x-ca-webhook del webhook de @AvilesIA_bot');
-- Sin ese secreto (o sin la cabecera) la función devuelve -1 y no borra nada.

create or replace function carreras.webhook_telegram_autorizado()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  h text;
  s text;
begin
  begin
    h := (nullif(current_setting('request.headers', true), '')::json) ->> 'x-ca-webhook';
  exception when others then
    return false;
  end;
  select ds.decrypted_secret into s from vault.decrypted_secrets ds where ds.name = 'ca_webhook_secreto' limit 1;
  if h is null or s is null or length(s) < 32 then
    return false;
  end if;
  return extensions.digest(h, 'sha256') = extensions.digest(s, 'sha256');
end;
$function$;
revoke all on function carreras.webhook_telegram_autorizado() from public, anon, authenticated;

-- /stop y /baja: desvincula ese chat de Carreras Asturias (borra su fila de carreras.alertas_telegram).
-- Devuelve cuántos vínculos ha borrado (0 si no había) o -1 si la cabecera secreta falta o no coincide.
create or replace function carreras.alertas_telegram_desvincular(p_chat_id bigint)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  n int;
begin
  if not carreras.webhook_telegram_autorizado() then
    return -1;
  end if;
  if p_chat_id is null or p_chat_id <= 0 then
    return 0;
  end if;
  delete from carreras.alertas_telegram t where t.chat_id = p_chat_id;
  get diagnostics n = row_count;
  return n;
end;
$function$;
revoke all on function carreras.alertas_telegram_desvincular(bigint) from public, anon, authenticated;
grant execute on function carreras.alertas_telegram_desvincular(bigint) to anon, service_role;
