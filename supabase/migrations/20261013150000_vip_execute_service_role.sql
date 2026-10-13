-- A1: carreras.vip_* solo service_role.
-- La web no llama a claim/status/token. El contador de clics sigue en
-- public.vip_cta_clicks_count (security definer) desde /api/vip-cta con la
-- clave anon, porque no hay service_role en el proyecto de Vercel.
-- n8n, si usa service_role, conserva EXECUTE en carreras y en los wrappers public.

revoke execute on function carreras.vip_claim_telegram(text, bigint, text) from public, anon, authenticated;
revoke execute on function carreras.vip_cta_clicks_count() from public, anon, authenticated;
revoke execute on function carreras.vip_issue_claim_token(text) from public, anon, authenticated;
revoke execute on function carreras.vip_lookup_claim(text) from public, anon, authenticated;
revoke execute on function carreras.vip_subscriber_status(text) from public, anon, authenticated;
revoke execute on function carreras.vip_subscribers_enforce_max_active() from public, anon, authenticated;

grant execute on function carreras.vip_claim_telegram(text, bigint, text) to service_role;
grant execute on function carreras.vip_cta_clicks_count() to service_role;
grant execute on function carreras.vip_issue_claim_token(text) to service_role;
grant execute on function carreras.vip_lookup_claim(text) to service_role;
grant execute on function carreras.vip_subscriber_status(text) to service_role;
grant execute on function carreras.vip_subscribers_enforce_max_active() to service_role;

alter function carreras.vip_subscribers_enforce_max_active() set search_path = carreras;

revoke execute on function public.vip_claim_telegram(text, bigint, text) from public, anon, authenticated;
revoke execute on function public.vip_issue_claim_token(text) from public, anon, authenticated;
revoke execute on function public.vip_lookup_claim(text) from public, anon, authenticated;
revoke execute on function public.vip_subscriber_status(text) from public, anon, authenticated;

grant execute on function public.vip_claim_telegram(text, bigint, text) to service_role;
grant execute on function public.vip_issue_claim_token(text) to service_role;
grant execute on function public.vip_lookup_claim(text) to service_role;
grant execute on function public.vip_subscriber_status(text) to service_role;
