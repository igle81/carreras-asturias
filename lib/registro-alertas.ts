/** Correo normalizado para el alta de avisos. Null si no es usable. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailRegistroValido(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 320) return null;
  if (!EMAIL.test(email)) return null;
  return email;
}

export const ALERTAS_CONFIRMAR_PATH = "/alertas/confirmar";

export function urlConfirmarAlertas(origin: string): string {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  return `${base}${ALERTAS_CONFIRMAR_PATH}`;
}
