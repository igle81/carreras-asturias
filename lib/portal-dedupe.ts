import type { Evento } from "./types";

/**
 * Alias lote nuevo → ficha canónica. No borra filas en Supabase.
 * También se ocultan filas con `duplicado_de` si la columna viene en el SELECT.
 */
export const PORTAL_DUPLICATE_OF: Record<string, string> = {
  "open-endurastur-avalanchillas-2026-avalancha-illas-2026-10-11-ciclismo":
    "open-endurastur-avalanchillas-illas-2026",
};

export function resolveCanonicalEventId(
  id: string,
  events: Array<Pick<Evento, "id_canonico" | "duplicado_de">> = [],
): string {
  const hardcoded = PORTAL_DUPLICATE_OF[id];
  if (hardcoded) return hardcoded;
  const row = events.find((event) => event.id_canonico === id);
  if (row?.duplicado_de) return row.duplicado_de;
  return id;
}

export function isPortalDuplicate(
  event: Pick<Evento, "id_canonico" | "duplicado_de">,
): boolean {
  if (event.duplicado_de) return true;
  return event.id_canonico in PORTAL_DUPLICATE_OF;
}

export function hidePortalDuplicates<T extends Pick<Evento, "id_canonico" | "duplicado_de">>(
  events: T[],
): T[] {
  return events.filter((event) => !isPortalDuplicate(event));
}
