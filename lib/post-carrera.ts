import { clasificacionUrl } from "./clasificacion";
import { isListedOnPortal, isRaceFinished } from "./dates";
import type { Evento } from "./types";

export type EventCta = {
  label: string;
  href: string;
  external: boolean;
};

/**
 * Misma rutina de fin de carrera (barrido 20:15 + loop Investigador):
 * no se borra; CTA Inscribirme → Clasificación (URL persistida o ancla de ficha).
 */
export function postCarreraCta(event: Evento, from = new Date()): EventCta | null {
  if (!isRaceFinished(event.fecha_inicio, event.fecha_fin, from)) return null;
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
  return events.filter((event) => isListedOnPortal(event.fecha_inicio, event.fecha_fin, from));
}

export function compareListedEvents(a: Evento, b: Evento, from = new Date()) {
  const aPast = isRaceFinished(a.fecha_inicio, a.fecha_fin, from);
  const bPast = isRaceFinished(b.fecha_inicio, b.fecha_fin, from);
  if (aPast !== bPast) return aPast ? 1 : -1;

  const da = a.fecha_inicio ?? "";
  const db = b.fecha_inicio ?? "";
  if (aPast) return db.localeCompare(da);
  return da.localeCompare(db);
}
