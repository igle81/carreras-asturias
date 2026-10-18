-- Seguridad N5 + N6 (revalidación PR #119, 18-10-2026).
-- Backup previo de definiciones y permisos: /workspace/ca-n1/backup/funciones_antes_n5n6.sql
--
-- N5: carreras.alertas_telegram_vincular solo la llama el webhook de @AvilesIA_bot
--     (alquileres-aviles PRO 3049b08, /api/telegram/webhook) con la clave publicable, es decir,
--     como anon. Ni la web de Carreras Asturias (PRO 285cd1a, pre, PR #119) ni ningún flujo n8n la llama.
--     Se quita EXECUTE a authenticated. La comprobación de la cabecera x-ca-webhook NO se pone aún:
--     Alquileres PRO no la envía (va con su B5).
revoke execute on function carreras.alertas_telegram_vincular(text, bigint) from authenticated;

-- N6: carreras.alertas_telegram_codigo con search_path vacío y nombres cualificados.
--     Misma firma, mismo comportamiento y mismos permisos (CREATE OR REPLACE los conserva).
create or replace function carreras.alertas_telegram_codigo()
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v text := 'ca_' || pg_catalog.encode(extensions.gen_random_bytes(18), 'hex');
begin
  if auth.uid() is null then
    raise exception 'sin sesión' using errcode = '42501';
  end if;
  insert into carreras.alertas_telegram (user_id, codigo, codigo_caduca, actualizado_en)
  values (auth.uid(), v, pg_catalog.now() + interval '1 hour', pg_catalog.now())
  on conflict (user_id) do update
    set codigo = excluded.codigo,
        codigo_caduca = excluded.codigo_caduca,
        actualizado_en = pg_catalog.now();
  return v;
end;
$function$;
