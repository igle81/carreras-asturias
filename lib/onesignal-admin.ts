import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase";

/**
 * Solo servidor. El external_id de OneSignal del administrador (el que usan
 * carreras.vip_subscribers y n8n) ya no está en el código ni en el bundle del cliente:
 * vive en ONESIGNAL_ADMIN_EXTERNAL_ID (Vercel, sin NEXT_PUBLIC_). Solo se entrega a
 * la sesión cuyo user_id es ONESIGNAL_ADMIN_USER_ID (la cuenta de Javier).
 */
type EnvLike = Record<string, string | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const VARIABLE_EXTERNAL_ID_ADMIN = "ONESIGNAL_ADMIN_EXTERNAL_ID";
export const VARIABLE_USER_ID_ADMIN = "ONESIGNAL_ADMIN_USER_ID";

function uuidDe(env: EnvLike, clave: string): string | null {
  const valor = env[clave]?.trim().toLowerCase();
  return valor && UUID.test(valor) ? valor : null;
}

export type ExternalIdAdmin =
  | { ok: true; externalId: string }
  | { ok: false; status: 401 | 403 | 503; error: "falta_sesion" | "sesion_invalida" | "no_autorizado" | "sin_configurar" };

export type Opciones = {
  env?: EnvLike;
  /** Devuelve el user_id de la sesión o null. Por defecto lo valida Supabase Auth (clave anon + token del usuario). */
  userIdDeSesion?: (token: string) => Promise<string | null>;
};

async function userIdSupabase(token: string): Promise<string | null> {
  const cliente = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await cliente.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

/** Resuelve el external_id del administrador a partir del user_id de la sesión. */
export async function externalIdAdminParaSesion(token: string, opciones: Opciones = {}): Promise<ExternalIdAdmin> {
  const env = opciones.env ?? process.env;
  const limpio = token.trim();
  if (!limpio) return { ok: false, status: 401, error: "falta_sesion" };

  const externalId = uuidDe(env, VARIABLE_EXTERNAL_ID_ADMIN);
  const adminUserId = uuidDe(env, VARIABLE_USER_ID_ADMIN);
  if (!externalId || !adminUserId) return { ok: false, status: 503, error: "sin_configurar" };

  const userId = (await (opciones.userIdDeSesion ?? userIdSupabase)(limpio))?.toLowerCase() ?? null;
  if (!userId) return { ok: false, status: 401, error: "sesion_invalida" };
  if (userId !== adminUserId) return { ok: false, status: 403, error: "no_autorizado" };
  return { ok: true, externalId };
}
