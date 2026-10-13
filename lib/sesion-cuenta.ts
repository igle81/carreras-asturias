import { RUTA_PORTADA } from "./registro-alertas";

type ClienteCierre = {
  auth: { signOut: () => Promise<{ error: { message: string } | null }> };
};

function irAPortada(ruta: string) {
  window.location.href = ruta;
}

/** Cierra la sesión de Supabase y vuelve a la portada. */
export async function cerrarSesion(
  cliente?: ClienteCierre,
  irA: (ruta: string) => void = irAPortada,
): Promise<void> {
  const c = cliente ?? (await import("./supabase")).getSupabase();
  const { error } = await c.auth.signOut();
  if (error) throw new Error(error.message);
  irA(RUTA_PORTADA);
}
