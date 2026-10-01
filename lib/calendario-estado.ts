import { clasificacionUrl } from "./clasificacion";
import { isListedOnPortal, isRaceFinished } from "./fin-estimado";
import { hidePortalDuplicates } from "./portal-dedupe";
import type { Evento } from "./types";

export type FiltroEstadoCalendario = {
  celebradas: boolean;
  conClasificacion: boolean;
};

/** Prueba ya disputada: ha pasado la hora estimada de fin. */
export function carreraYaCelebrada(event: Evento, from = new Date()) {
  return isRaceFinished(event, from);
}

export function tieneClasificacionEnlazada(event: Pick<Evento, "url_clasificacion">) {
  return clasificacionUrl(event) != null;
}

/**
 * Calendario por defecto: próximas y acabadas dentro de los 30 días.
 * «Ya celebradas» abre todas las disputadas, también las anteriores a esa ventana.
 * «Con clasificación» es un recorte de esas celebradas: solo con enlace.
 */
export function eventosVisiblesEnCalendario(
  events: Evento[],
  filtro: FiltroEstadoCalendario,
  from = new Date(),
) {
  const base = hidePortalDuplicates(events);
  const pool =
    filtro.celebradas || filtro.conClasificacion
      ? base.filter((event) => carreraYaCelebrada(event, from))
      : base.filter((event) => isListedOnPortal(event, from));
  if (!filtro.conClasificacion) return pool;
  return pool.filter((event) => tieneClasificacionEnlazada(event));
}

export function textoRecuentoCalendario(count: number, filtro: FiltroEstadoCalendario) {
  const pruebas = count === 1 ? "prueba" : "pruebas";
  if (filtro.conClasificacion) return `${count} ${pruebas} con clasificación`;
  if (filtro.celebradas) {
    return count === 1 ? "1 prueba ya celebrada" : `${count} pruebas ya celebradas`;
  }
  return `${count} ${pruebas}`;
}
