import { createClient } from "@supabase/supabase-js";
import { notificarAdminRegistro, type ResultadoCanal } from "./alertas-admin";
import { emailRegistroValido, resolverDatosAlta } from "./registro-alertas";
import { PRIVACIDAD_VERSION } from "./legal";
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase";

export type ConfirmarSuscripcion =
  | { ok: true; nueva: boolean; email: string; avisos: ResultadoCanal[] }
  | {
      ok: false;
      status: number;
      error: "falta_sesion" | "sesion_invalida" | "datos_invalidos" | "no_se_pudo_guardar";
    };

function clienteUsuario(accessToken: string, schema?: "carreras") {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
    ...(schema ? { db: { schema } } : {}),
  });
}

/** Crea la fila solo si este usuario aún no está. El aviso al administrador sale aquí, al confirmar. */
export async function confirmarSuscripcionAlertas(
  accessToken: string,
  entrada: unknown = {},
): Promise<ConfirmarSuscripcion> {
  const token = accessToken.trim();
  if (!token) return { ok: false, status: 401, error: "falta_sesion" };

  const { data, error } = await clienteUsuario(token).auth.getUser(token);
  const email = data.user?.email?.trim().toLowerCase();
  if (error || !data.user || !email) {
    return { ok: false, status: 401, error: "sesion_invalida" };
  }

  const db = clienteUsuario(token, "carreras");
  const { data: existing, error: selectError } = await db
    .from("suscripciones_alertas")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (selectError) {
    console.error("No se pudo leer suscripciones_alertas", selectError.message);
    return { ok: false, status: 500, error: "no_se_pudo_guardar" };
  }
  if (existing) return { ok: true, nueva: false, email, avisos: [] };

  const datos = resolverDatosAlta(entrada, data.user.user_metadata);
  const meta = data.user.user_metadata as { correo_avisos?: unknown } | undefined;
  const correoAvisos = emailRegistroValido(meta?.correo_avisos) ?? email;

  const { error: insertError } = await db.from("suscripciones_alertas").insert({
    user_id: data.user.id,
    email,
    nombre: datos?.nombre ?? null,
    instagram: datos?.instagram ?? null,
    correo_avisos: correoAvisos,
    consentimiento: true,
    consentimiento_en: new Date().toISOString(),
    consentimiento_version: PRIVACIDAD_VERSION,
    push_activado: datos?.pushActivado ?? false,
    origen: "web",
  });

  if (insertError) {
    if (insertError.code === "23505") return { ok: true, nueva: false, email, avisos: [] };
    console.error("No se pudo crear la suscripción de avisos", insertError.message);
    return { ok: false, status: 500, error: "no_se_pudo_guardar" };
  }

  const avisos = await notificarAdminRegistro({
    email,
    userId: data.user.id,
    correoAvisos,
    telegram: "pendiente",
    pushActivado: datos?.pushActivado ?? false,
  });
  return { ok: true, nueva: true, email, avisos };
}
