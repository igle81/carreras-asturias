import { RUTA_PORTADA } from "./registro-alertas";
import { getSupabase } from "./supabase";

type ClienteCierre = {
  auth: { signOut: () => Promise<{ error: { message: string } | null }> };
};

function irAPortada(ruta: string) {
  window.location.href = ruta;
}

/** Cierra la sesión de Supabase y vuelve a la portada. */
export async function cerrarSesion(
  cliente: ClienteCierre = getSupabase(),
  irA: (ruta: string) => void = irAPortada,
): Promise<void> {
  const { error } = await cliente.auth.signOut();
  if (error) throw new Error(error.message);
  irA(RUTA_PORTADA);
}
