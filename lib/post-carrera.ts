import { clasificacionUrl } from "./clasificacion";
import { isListedOnPortal, isRaceFinished } from "./fin-estimado";
import { hidePortalDuplicates } from "./portal-dedupe";
import type { Evento } from "./types";

export type EventCta = {
  label: string;
  href: string;
  external: boolean;
};

/**
 * Al persistir una prueba con fecha se estima el fin (ritmo lento + margen).
 * En ese instante arranca la rutina de clasificación. CTA Inscribirme → Clasificación.
 */
export function postCarreraCta(event: Evento, from = new Date()): EventCta | null {
  if (!isRaceFinished(event, from)) return null;
  const url = clasificacionUrl(event);
  if (url) {
    return { label: "Clasificación", href: url, external: true };
  }
  return {
    label: "Clasificación",
    href: `/evento/${event.id_canonico}#clasificacion`,
    external: false,
  };
}

export function listedEvents(events: Evento[], from = new Date()) {
  return hidePortalDuplicates(events).filter((event) => isListedOnPortal(event, from));
}

export function compareListedEvents(a: Evento, b: Evento, from = new Date()) {
  const aPast = isRaceFinished(a, from);
  const bPast = isRaceFinished(b, from);
  if (aPast !== bPast) return aPast ? 1 : -1;

  const da = a.fecha_inicio ?? "";
  const db = b.fecha_inicio ?? "";
  if (aPast) return db.localeCompare(da);
  return da.localeCompare(db);
}
