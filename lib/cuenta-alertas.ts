import { createClient } from "@supabase/supabase-js";
import { notificarAdminRegistro, type ResultadoCanal } from "./alertas-admin";
import { avisarAdminAlCrearCuenta, cuentaRegistroValida, redirectConfirmacionCarreras } from "./registro-alertas";
import { PRIVACIDAD_VERSION } from "./legal";
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase";

export type AltaCuenta =
  | { ok: true; seco: true; redirect: string }
  | { ok: true; confirmarCorreo: boolean; avisos: ResultadoCanal[] }
  | { ok: false; status: number; error: string };

function cliente(accessToken?: string, schema?: "carreras") {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
    ...(schema ? { db: { schema } } : {}),
  });
}

/** Alta con correo y contraseña. El origen válido es la cabecera Origin, no el cuerpo. */
export async function crearCuentaAlertas(entrada: unknown, origenCabecera: unknown): Promise<AltaCuenta> {
  const seco = Boolean(entrada && typeof entrada === "object" && (entrada as { seco?: unknown }).seco === true);
  const redirect = redirectConfirmacionCarreras(origenCabecera);
  if (seco) {
    if (!redirect) {
      return { ok: false, status: 400, error: "Abre el registro desde la web de Carreras para confirmar el correo." };
    }
    return { ok: true, seco: true, redirect };
  }
  const validada = cuentaRegistroValida(entrada);
  if (!validada.ok) return { ok: false, status: 400, error: validada.error };
  if (!redirect) {
    return { ok: false, status: 400, error: "Abre el registro desde la web de Carreras para confirmar el correo." };
  }
  const { correo, password, correoAvisos } = validada.cuenta;

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
      return { ok: true, confirmarCorreo: true, avisos: [] };
    }
    console.error("No se pudo crear la cuenta", error.message);
    return { ok: false, status: 400, error: "No se ha podido completar el registro. Inténtalo de nuevo." };
  }

  const user = data.user;
  if (!user || (Array.isArray(user.identities) && user.identities.length === 0)) {
    return { ok: true, confirmarCorreo: true, avisos: [] };
  }

  const token = data.session?.access_token;
  let filaNueva = false;
  if (token) {
    const { error: insertError } = await cliente(token, "carreras").from("suscripciones_alertas").insert({
      user_id: user.id,
      email: correo,
      correo_avisos: correoAvisos,
      consentimiento: true,
      consentimiento_en: new Date().toISOString(),
      consentimiento_version: PRIVACIDAD_VERSION,
      push_activado: false,
      origen: "web",
    });
    if (insertError && insertError.code !== "23505") {
      console.error("No se pudo guardar el perfil de avisos", insertError.message);
    }
    filaNueva = !insertError;
  }

  const avisos =
    filaNueva && avisarAdminAlCrearCuenta(true)
      ? await notificarAdminRegistro({
          email: correo,
          userId: user.id,
          correoAvisos,
          telegram: "pendiente",
          pushActivado: false,
        })
      : [];

  return { ok: true, confirmarCorreo: !token, avisos };
}
