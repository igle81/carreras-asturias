import { createClient } from "@supabase/supabase-js";
import { notificarAdminRegistro, type ResultadoCanal } from "./alertas-admin";
import { cuentaRegistroValida, RUTA_ACCESO } from "./registro-alertas";
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase";

export type AltaCuenta =
  | { ok: true; confirmarCorreo: boolean; avisos: ResultadoCanal[] }
  | { ok: false; status: number; error: string };

function cliente(accessToken?: string, schema?: "carreras") {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
    ...(schema ? { db: { schema } } : {}),
  });
}

/** Alta con correo y contraseña, como asturRentIA. El aviso al administrador sale una vez. */
export async function crearCuentaAlertas(entrada: unknown, origin: string): Promise<AltaCuenta> {
  const validada = cuentaRegistroValida(entrada);
  if (!validada.ok) return { ok: false, status: 400, error: validada.error };
  const { correo, password, correoAvisos } = validada.cuenta;
  const redirect = `${origin.replace(/\/$/, "")}${RUTA_ACCESO}`;

  const { data, error } = await cliente().auth.signUp({
    email: correo,
    password,
    options: {
      emailRedirectTo: redirect,
      data: { correo_avisos: correoAvisos, consentimiento: true, app: "carreras" },
    },
  });

  if (error) {
    const texto = error.message.toLowerCase();
    if (texto.includes("already") || texto.includes("registered") || texto.includes("exists")) {
      return { ok: false, status: 400, error: "Ese correo ya tiene cuenta. Entra desde el acceso." };
    }
    if (texto.includes("password")) {
      return { ok: false, status: 400, error: "La contraseña no vale. Usa al menos 8 caracteres." };
    }
    console.error("No se pudo crear la cuenta", error.message);
    return { ok: false, status: 400, error: "No se pudo crear la cuenta." };
  }

  const user = data.user;
  if (!user || (Array.isArray(user.identities) && user.identities.length === 0)) {
    return { ok: false, status: 400, error: "Ese correo ya tiene cuenta. Entra desde el acceso." };
  }

  const token = data.session?.access_token;
  if (token) {
    const { error: insertError } = await cliente(token, "carreras").from("suscripciones_alertas").insert({
      user_id: user.id,
      email: correo,
      correo_avisos: correoAvisos,
      consentimiento: true,
      consentimiento_en: new Date().toISOString(),
      push_activado: false,
      origen: "web",
    });
    if (insertError && insertError.code !== "23505") {
      console.error("No se pudo guardar el perfil de avisos", insertError.message);
    }
  }

  const avisos = await notificarAdminRegistro({
    email: correo,
    userId: user.id,
    nombre: "",
    instagram: null,
    correoAvisos,
    telegram: "pendiente",
    pushActivado: false,
  });

  return { ok: true, confirmarCorreo: !token, avisos };
}
