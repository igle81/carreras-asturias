import { madridClock } from "./dates";
import { normalizeDisciplineKey, resolveModalidad, type ModalidadId } from "./modalidad";
import type { Distancia, Evento } from "./types";

/** Salida por defecto si no hay hora (Europe/Madrid). */
export const DEFAULT_START_HOUR_MADRID = 9;
export const NOCTURNA_START_HOUR_MADRID = 21;

/** Minutos extra después del último (ritmo lento) antes de buscar clasificación. */
export const CLASIFICACION_MARGIN_MIN = 30;

export const POST_RACE_RETENTION_DAYS = 30;

/** km/h lentos: a pie ritmo de cola; bici cola de competición/cicloturista. */
const KMH_PIE: Record<string, number> = {
  asfalto: 7,
  media_maraton: 7,
  nocturna: 6,
  trail: 5,
  mixto: 5,
  cross: 5,
  skyrace: 4,
  marcha: 4.5,
};

const KMH_BICI: Record<string, number> = {
  carretera: 22,
  ciclista_carretera: 22,
  cicloturismo: 22,
  criterium: 22,
  gravel: 16,
  mtb: 14,
  btt: 14,
  mountain_bike: 14,
  enduro: 12,
  ciclocross: 18,
  cx: 18,
};

const DEFAULT_HOURS: Record<string, number> = {
  asfalto: 3,
  media_maraton: 3,
  nocturna: 5,
  trail: 6,
  mixto: 6,
  cross: 4,
  skyrace: 8,
  marcha: 5,
  carretera: 5,
  ciclista_carretera: 5,
  cicloturismo: 5,
  criterium: 2,
  gravel: 5,
  mtb: 6,
  btt: 6,
  enduro: 6,
  ciclocross: 2,
};

export type ClasificacionAgenda = {
  startAt: Date;
  dueAt: Date;
  km: number | null;
  kmh: number;
  durationMs: number;
  marginMin: number;
};

export type EventoAgenda = Pick<
  Evento,
  "fecha_inicio" | "fecha_fin" | "distancias" | "modalidad" | "disciplina_normalizada"
>;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

/** Interpreta YYYY-MM-DD + hora de pared en Europe/Madrid. */
export function madridWallToUtc(ymd: string, hour: number, minute = 0): Date | null {
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) return null;
  let ms = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i += 1) {
    const shown = madridClock(new Date(ms));
    const shownDay = Date.UTC(shown.year, shown.month - 1, shown.day);
    const wantDay = Date.UTC(year, month - 1, day);
    const deltaMin =
      (shownDay - wantDay) / 60_000 + (shown.hour * 60 + shown.minute - (hour * 60 + minute));
    if (deltaMin === 0) break;
    ms -= deltaMin * 60_000;
  }
  return new Date(ms);
}

function kmFromLabel(label: string): number | null {
  const km = label.match(/(\d+(?:[.,]\d+)?)\s*(?:km|k)\b/i);
  if (km) return Number(km[1].replace(",", "."));
  const coded = label.match(/\bk(\d+(?:[.,]\d+)?)\b/i);
  if (coded) return Number(coded[1].replace(",", "."));
  return null;
}

export function longestDistanceKm(distancias: Distancia[] | null | undefined): number | null {
  if (!distancias?.length) return null;
  let max = 0;
  for (const item of distancias) {
    const fromField = typeof item.km === "number" && Number.isFinite(item.km) ? item.km : null;
    const fromLabel = item.etiqueta ? kmFromLabel(item.etiqueta) : null;
    const km = fromField ?? fromLabel;
    if (km && km > max) max = km;
  }
  return max > 0 ? max : null;
}

export function slowRaceKmh(event: EventoAgenda): number {
  const modalidad: ModalidadId = resolveModalidad(event);
  const key = event.disciplina_normalizada
    ? normalizeDisciplineKey(event.disciplina_normalizada)
    : "";
  if (modalidad === "ciclismo") {
    return KMH_BICI[key] ?? 18;
  }
  return KMH_PIE[key] ?? 6;
}

function defaultDurationMs(event: EventoAgenda): number {
  const key = event.disciplina_normalizada
    ? normalizeDisciplineKey(event.disciplina_normalizada)
    : "";
  const hours = DEFAULT_HOURS[key] ?? (resolveModalidad(event) === "ciclismo" ? 5 : 5);
  return hours * 3_600_000;
}

function startHourMadrid(event: EventoAgenda): number {
  const key = event.disciplina_normalizada
    ? normalizeDisciplineKey(event.disciplina_normalizada)
    : "";
  return key === "nocturna" ? NOCTURNA_START_HOUR_MADRID : DEFAULT_START_HOUR_MADRID;
}

/**
 * Al conocer fecha (+ distancia/disciplina) se estima el fin a ritmo lento
 * y se programa la primera comprobación de clasificación: fin + margen.
 */
export function clasificacionAgenda(event: EventoAgenda): ClasificacionAgenda | null {
  if (!event.fecha_inicio) return null;
  const startAt = madridWallToUtc(event.fecha_inicio, startHourMadrid(event), 0);
  if (!startAt) return null;

  const km = longestDistanceKm(event.distancias);
  const kmh = slowRaceKmh(event);
  const durationMs = km ? (km / kmh) * 3_600_000 : defaultDurationMs(event);
  let dueAt = new Date(startAt.getTime() + durationMs + CLASIFICACION_MARGIN_MIN * 60_000);

  if (event.fecha_fin && event.fecha_fin > event.fecha_inicio) {
    const lastDay = madridWallToUtc(event.fecha_fin, 18, 0);
    if (lastDay && lastDay.getTime() + CLASIFICACION_MARGIN_MIN * 60_000 > dueAt.getTime()) {
      dueAt = new Date(lastDay.getTime() + CLASIFICACION_MARGIN_MIN * 60_000);
    }
  }

  return {
    startAt,
    dueAt,
    km,
    kmh,
    durationMs,
    marginMin: CLASIFICACION_MARGIN_MIN,
  };
}

export function clasificacionDueAt(event: EventoAgenda): Date | null {
  return clasificacionAgenda(event)?.dueAt ?? null;
}

export function isRaceFinished(event: EventoAgenda, from = new Date()) {
  const due = clasificacionDueAt(event);
  if (!due) return false;
  return from.getTime() >= due.getTime();
}

export function isListedOnPortal(event: EventoAgenda, from = new Date()) {
  const due = clasificacionDueAt(event);
  if (!due) return Boolean(event.fecha_inicio);
  if (from.getTime() < due.getTime()) return true;
  const keepMs = POST_RACE_RETENTION_DAYS * 86_400_000;
  return from.getTime() <= due.getTime() + keepMs;
}

export function formatDueMadrid(due: Date): string {
  const clock = madridClock(due);
  return `${clock.year}-${pad2(clock.month)}-${pad2(clock.day)} ${pad2(clock.hour)}:${pad2(clock.minute)}`;
}
