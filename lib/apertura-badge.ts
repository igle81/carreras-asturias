import type { Evento } from "@/lib/types";

export type AperturaBadgeKind =
  | "abierta_hoy"
  | "abierta_ayer"
  | "recien_abierta"
  | null;

const ETIQUETAS_APERTURA = [
  "abierta_hoy",
  "abierta_ayer",
  "recien_abierta",
] as const;

type EventoApertura = Pick<
  Evento,
  "etiquetas" | "fecha_apertura_inscripcion"
>;

function madridTodayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function ymdToUtcMs(ymd: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [year, month, day] = ymd.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Días civiles entre la fecha de apertura y hoy en Europe/Madrid. */
export function daysSinceApertura(
  fechaApertura: string,
  now = new Date(),
): number | null {
  const ymd = fechaApertura.slice(0, 10);
  const openMs = ymdToUtcMs(ymd);
  const todayMs = ymdToUtcMs(madridTodayYmd(now));
  if (openMs === null || todayMs === null) return null;
  return Math.round((todayMs - openMs) / 86_400_000);
}

function badgeFromDays(days: number): AperturaBadgeKind {
  if (days === 0) return "abierta_hoy";
  if (days === 1) return "abierta_ayer";
  if (days >= 2 && days <= 4) return "recien_abierta";
  return null;
}

/**
 * Badge de apertura: etiquetas exclusivas o fecha real.
 * No usa el boolean `recien_abierta` (puede venir de fecha_hallazgo).
 */
export function resolveAperturaBadge(
  event: EventoApertura,
  now = new Date(),
): AperturaBadgeKind {
  const tags = event.etiquetas ?? [];
  for (const tag of ETIQUETAS_APERTURA) {
    if (tags.includes(tag)) return tag;
  }

  const fecha = event.fecha_apertura_inscripcion;
  if (!fecha) return null;

  const days = daysSinceApertura(fecha, now);
  if (days === null || days < 0) return null;
  return badgeFromDays(days);
}

export function aperturaBadgeLabel(kind: AperturaBadgeKind): string | null {
  switch (kind) {
    case "abierta_hoy":
      return "Abierta hoy";
    case "abierta_ayer":
      return "Abierta ayer";
    case "recien_abierta":
      return "🔥 ¡RECIÉN ABIERTA!";
    default:
      return null;
  }
}

export function hasAperturaReciente(
  event: EventoApertura,
  now = new Date(),
): boolean {
  return resolveAperturaBadge(event, now) !== null;
}

export function isRecienAbiertaFuego(
  event: EventoApertura,
  now = new Date(),
): boolean {
  return resolveAperturaBadge(event, now) === "recien_abierta";
}
