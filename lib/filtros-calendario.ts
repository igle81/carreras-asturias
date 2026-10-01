import { clasificacionUrl } from "./clasificacion";
import { isRaceFinished, POST_RACE_RETENTION_DAYS } from "./fin-estimado";
import { listedEvents } from "./post-carrera";
import type { Evento } from "./types";

export type FiltrosEstado = {
  /** Carreras ya celebradas que siguen en el calendario (`POST_RACE_RETENTION_DAYS`). */
  cerradas: boolean;
  /** Solo pruebas con enlace de clasificación. */
  conClasificacion: boolean;
};

/**
 * «Cerradas» = la prueba ya terminó (fin estimado), no solo la inscripción.
 * Usa la misma ventana que el listado: `listedEvents` / `isListedOnPortal`
 * (`POST_RACE_RETENTION_DAYS` tras el fin estimado).
 */
export function pasaFiltrosEstado(
  event: Evento,
  filtros: FiltrosEstado,
  from = new Date(),
): boolean {
  if (filtros.cerradas && !isRaceFinished(event, from)) return false;
  if (filtros.conClasificacion && !clasificacionUrl(event)) return false;
  return true;
}

export function eventosVisiblesEnCalendario(
  events: Evento[],
  filtros: FiltrosEstado,
  from = new Date(),
): Evento[] {
  return listedEvents(events, from).filter((event) => pasaFiltrosEstado(event, filtros, from));
}

export function textoRecuento(total: number, filtros: FiltrosEstado): string {
  const prueba = total === 1 ? "prueba" : "pruebas";
  const partes = [`${total} ${prueba}`];
  if (filtros.cerradas) partes.push(total === 1 ? "cerrada" : "cerradas");
  if (filtros.conClasificacion) partes.push("con clasificación");
  return partes.join(" ");
}

export function mensajeCalendarioVacio(filtros: FiltrosEstado & { recien: boolean }): string {
  if (filtros.recien && !filtros.cerradas && !filtros.conClasificacion) {
    return "No hay aperturas en los últimos 3 días.";
  }
  if (filtros.cerradas && filtros.conClasificacion) {
    return "Ninguna carrera cerrada tiene la clasificación enlazada con esos filtros.";
  }
  if (filtros.cerradas) {
    return `No hay carreras cerradas con esos filtros. Solo se listan las ya celebradas de los últimos ${POST_RACE_RETENTION_DAYS} días.`;
  }
  if (filtros.conClasificacion) {
    return "Ninguna prueba tiene la clasificación enlazada con esos filtros.";
  }
  return "Ninguna prueba encaja con esos filtros. Prueba a soltar alguno.";
}
