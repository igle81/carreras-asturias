import { isRaceFinished } from "./fin-estimado";
import type { Evento } from "./types";

export type ClasificacionVista = "publicada" | "pendiente" | "proxima";

function asHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

export function clasificacionUrl(
  event: Pick<Evento, "url_clasificacion">,
): string | null {
  return asHttpsUrl(event.url_clasificacion);
}

/** Enlace visible en la tarjeta del listado. Null si no hay URL utilizable. */
export function enlaceClasificacionTarjeta(
  event: Pick<Evento, "url_clasificacion">,
): { href: string; label: "Ver clasificación" } | null {
  const href = clasificacionUrl(event);
  if (!href) return null;
  return { href, label: "Ver clasificación" };
}

export function clasificacionVista(
  event: Pick<
    Evento,
    | "fecha_inicio"
    | "fecha_fin"
    | "distancias"
    | "modalidad"
    | "disciplina_normalizada"
    | "url_clasificacion"
    | "estado_clasificacion"
  >,
): ClasificacionVista {
  if (clasificacionUrl(event) || event.estado_clasificacion === "publicada") {
    return clasificacionUrl(event) ? "publicada" : "pendiente";
  }
  if (isRaceFinished(event)) return "pendiente";
  return "proxima";
}
