import { getSupabase } from "./supabase";

/**
 * La ruta antigua `/es/all-sports/running-trail.html` responde 404.
 * Esta guía de trail está publicada; el `mc` de AvilesIA se conserva.
 */
export const DECATHLON_RUNNING_HREF =
  "https://www.decathlon.es/es/c/htc/las-mejores-zapatillas-de-trail-running_daac61c5-1687-4240-addd-60825b6f8354?mc=AVILESIANETWORK";

export const AFILIADO_APP_SLUG = "carreras";
export const AFILIADO_TIPO_EVENTO = "clic_afiliado";
export const AFILIADO_DESTINO = "decathlon-running-trail";

/**
 * Tabla de métricas de flota, si existe en este proyecto.
 * Hoy no está: no se crea aquí. El insert usa solo las columnas que Javier nombró.
 */
export const CONTROL_FLOTA_METRICAS = "control_flota_metricas";

const MAX_PATH = 300;

type SupabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

export type ClicAfiliadoInput = {
  path?: unknown;
};

export type ClicAfiliadoResultado = {
  recorded: boolean;
  prepared: true;
  absent?: boolean;
};

export function filaClicAfiliado(): { app_slug: string; tipo_evento: string } {
  return {
    app_slug: AFILIADO_APP_SLUG,
    tipo_evento: AFILIADO_TIPO_EVENTO,
  };
}

export function sanitizeAfiliadoPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "/";
  return trimmed.slice(0, MAX_PATH);
}

export function esTablaMetricasAusente(error: SupabaseErrorLike): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  if (code === "42P01" || code === "PGRST205" || code === "PGRST204" || code === "42703") {
    return true;
  }
  return (
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("column")
  );
}

/**
 * Hook preparado. Intenta insertar en `control_flota_metricas`.
 * Si la tabla (o una columna) no existe, no la crea: el clic sigue y queda anotado en el log.
 */
export async function registrarClicAfiliado(
  input: ClicAfiliadoInput = {},
): Promise<ClicAfiliadoResultado> {
  const path = sanitizeAfiliadoPath(input.path);
  try {
    const { error } = await getSupabase().from(CONTROL_FLOTA_METRICAS).insert(filaClicAfiliado());
    if (!error) return { recorded: true, prepared: true };
    if (esTablaMetricasAusente(error)) {
      console.warn("control_flota_metricas no está en este proyecto", { path, destino: AFILIADO_DESTINO });
      return { recorded: false, prepared: true, absent: true };
    }
    console.error("No se pudo registrar el clic de afiliado", error.message);
    return { recorded: false, prepared: true };
  } catch (error) {
    console.error("No se pudo registrar el clic de afiliado", error);
    return { recorded: false, prepared: true };
  }
}
