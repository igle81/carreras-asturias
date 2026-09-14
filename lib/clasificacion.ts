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
