import type { Evento } from "./types";

/**
 * Alias lote / ficha peor → ficha canónica. No borra filas en Supabase.
 * También se ocultan filas con `duplicado_de` si la columna viene en el SELECT.
 *
 * Lista canónica 2026-09-15 (Auditor Calidad BLOCK + excepción Llangreu).
 */
export const PORTAL_DUPLICATE_OF: Record<string, string> = {
  "marcha-solidaria-rober-contra-el-cancer-2026-2026-09-20-ciclismo":
    "marcha-solidaria-rober-contra-el-cancer-2026",
  "desafio-el-acebo-2026-2026-09-26-ciclismo": "desafio-el-acebo-2026",
  "open-endurastur-avalanchillas-2026-avalancha-illas-2026-10-11-ciclismo":
    "open-endurastur-avalanchillas-illas-2026",
  "mysterioux-race-2026": "mysterioux-race-2026-2026-10-11-pie",
  "10km-de-laviana-2026": "10k-laviana-2026-2026-12-06-pie",
  "abeduriu-nocturno-trail-race-2026-2026-10-10-pie":
    "abeduriu-nocturno-trail-race-2026",
  "vii-carrera-popular-llangreu-natural-2026-2026-10-18-pie":
    "llangreu-natural-2026-vii-carrera-popular-2026-10-18-pie",
  "vi-trail-minero-santa-barbara-2026-2026-11-28-pie":
    "trail-minero-santa-barbara-2026",
  "trofeo-pico-cueto-relevos-trail-2026": "trofeo-pico-cueto-2026-2026-10-04-pie",
};

/** Filas de prueba: fuera de listado, hero y recién. No redirigen a otra ficha. */
export const PORTAL_HIDDEN_IDS = new Set([
  "probe-ca-2026-09-14",
  "probe-ca-2026-09-14-b",
  "probe-ca-2026-09-14-c",
]);

export function isPortalProbe(id: string) {
  return id === "probe-ca-2026-09-14" || id.startsWith("probe-ca-2026-09-14");
}

export function resolveCanonicalEventId(
  id: string,
  events: Array<Pick<Evento, "id_canonico" | "duplicado_de">> = [],
): string {
  if (isPortalProbe(id) || PORTAL_HIDDEN_IDS.has(id)) return id;
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

export function isPortalExcluded(
  event: Pick<Evento, "id_canonico" | "duplicado_de">,
): boolean {
  if (PORTAL_HIDDEN_IDS.has(event.id_canonico) || isPortalProbe(event.id_canonico)) {
    return true;
  }
  return isPortalDuplicate(event);
}

export function hidePortalDuplicates<T extends Pick<Evento, "id_canonico" | "duplicado_de">>(
  events: T[],
): T[] {
  return events.filter((event) => !isPortalExcluded(event));
}
