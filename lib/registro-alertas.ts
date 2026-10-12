/** Correo normalizado para el alta de avisos. Null si no es usable. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;

export type DatosAlta = {
  nombre: string;
  instagram: string | null;
  pushActivado: boolean;
};

export type RegistroPendiente = {
  nombre: string;
  instagram: string | null;
  push: boolean;
};

export const REGISTRO_PENDIENTE_CLAVE = "ca-registro-pendiente";

export function emailRegistroValido(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 320) return null;
  if (!EMAIL.test(email)) return null;
  return email;
}

/** Página del alta. La cabecera solo enlaza aquí; el campo de correo no va en portada ni en el header. */
export const RUTA_REGISTRO = "/registro";

export const ALERTAS_CONFIRMAR_PATH = "/alertas/confirmar";

export function urlConfirmarAlertas(origin: string): string {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  return `${base}${ALERTAS_CONFIRMAR_PATH}`;
}

/** Nombre visible del alta. Null si está vacío o no cabe. */
export function nombreRegistroValido(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const nombre = value.trim().replace(/\s+/g, " ");
  if (nombre.length < 1 || nombre.length > 80) return null;
  if (/[\u0000-\u001f]/.test(nombre)) return null;
  return nombre;
}

/** Vacío es válido (opcional). Un texto que no sea @usuario no lo es. */
export function instagramRegistro(
  value: unknown,
): { ok: true; instagram: string | null } | { ok: false } {
  if (value == null) return { ok: true, instagram: null };
  if (typeof value !== "string") return { ok: false };
  const raw = value.trim();
  if (!raw) return { ok: true, instagram: null };
  const handle = raw.replace(/^@+/, "");
  if (!INSTAGRAM.test(handle)) return { ok: false };
  if (handle.startsWith(".") || handle.endsWith(".") || handle.includes("..")) return { ok: false };
  return { ok: true, instagram: `@${handle}` };
}

function esFuenteAlta(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && "nombre" in value);
}

function normalizarDatosAlta(fuente: Record<string, unknown>): DatosAlta | null {
  const nombre = nombreRegistroValido(fuente.nombre);
  if (!nombre) return null;
  const instagram = instagramRegistro("instagram" in fuente ? fuente.instagram : null);
  if (!instagram.ok) return null;
  const pushActivado =
    fuente.push === true || fuente.pushActivado === true || fuente.push_activado === true;
  return { nombre, instagram: instagram.instagram, pushActivado };
}

/** El cuerpo del alta manda. Si no trae nombre, se usa la metadata del magic link. */
export function resolverDatosAlta(body: unknown, metadata: unknown): DatosAlta | null {
  if (esFuenteAlta(body)) return normalizarDatosAlta(body);
  if (esFuenteAlta(metadata)) return normalizarDatosAlta(metadata);
  return null;
}

export function guardarRegistroPendiente(datos: RegistroPendiente): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REGISTRO_PENDIENTE_CLAVE, JSON.stringify(datos));
}

export function leerRegistroPendiente(): RegistroPendiente | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(REGISTRO_PENDIENTE_CLAVE);
    if (!raw) return null;
    const datos = resolverDatosAlta(JSON.parse(raw), null);
    if (!datos) return null;
    return { nombre: datos.nombre, instagram: datos.instagram, push: datos.pushActivado };
  } catch {
    return null;
  }
}

export function borrarRegistroPendiente(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REGISTRO_PENDIENTE_CLAVE);
}
