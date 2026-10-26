-- Aplicada en Supabase el 25-10-2026 a las 15:23 (hora de Madrid), versión 20261025142317, con OK de Seguridad (15:25) y Calidad (15:24, 9,4).
-- Carreras Asturias · Seguridad 25-10-2026 · B5 ca_ (cierre)
-- carreras.alertas_telegram_vincular exige la cabecera secreta del webhook de @AvilesIA_bot,
-- igual que carreras_es.alertas_telegram_vincular (que exige x-ces-webhook).
--
-- Mecanismo: el MISMO que carreras_es y que carreras.alertas_telegram_desvincular:
--   carreras.webhook_telegram_autorizado() (ya existe; SECURITY DEFINER, search_path '', EXECUTE solo postgres)
--   lee request.headers ->> 'x-ca-webhook' y lo compara (sha256) con Vault 'ca_webhook_secreto' (>= 32 caracteres).
--   Falla cerrado: sin cabecera, sin secreto o secreto corto => false.
-- Secreto: el propio de Carreras Asturias (x-ca-webhook / ca_webhook_secreto), NO el de carreras_es
--   (x-ces-webhook / ces_webhook_secreto). Es el que ya manda el webhook en PRO (CA_WEBHOOK_SECRETO).
--
-- Firma, tipo de retorno, SECURITY DEFINER y search_path = '' sin cambios. CREATE OR REPLACE conserva los permisos
-- actuales (EXECUTE: postgres, anon; authenticated revocado el 18-10 en 20261018143040). No se tocan permisos.
-- No toca carreras_es. Sin datos reales. El valor del secreto no aparece aquí.
-- Se aplica con apply_migration (va dentro de una transacción, por eso funciona set local).

set local lock_timeout = '5s';

create or replace function carreras.alertas_telegram_vincular(p_codigo text, p_chat_id bigint)
 returns boolean
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  n int;
begin
  -- Seguridad B5 ca_: solo el webhook de @AvilesIA_bot (cabecera x-ca-webhook = Vault ca_webhook_secreto).
  if not carreras.webhook_telegram_autorizado() then
    return false;
  end if;
  if p_codigo is null or p_chat_id is null or p_codigo !~ '^ca_[0-9a-f]{36}$' or p_chat_id <= 0 then
    return false;
  end if;
  update carreras.alertas_telegram
     set chat_id = p_chat_id,
         conectado_en = now(),
         codigo = null,
         codigo_caduca = null,
         actualizado_en = now()
   where codigo = p_codigo
     and codigo_caduca > now();
  get diagnostics n = row_count;
  return n = 1;
end
$function$;

comment on function carreras.alertas_telegram_vincular(text, bigint) is
  'Vincula un chat de Telegram con un código ca_ vigente. Solo con cabecera x-ca-webhook = Vault ca_webhook_secreto (Seguridad B5, 25-10-2026).';

