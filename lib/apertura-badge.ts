import { isHighlightEmbargoed } from "@/lib/highlight-embargo";
import type { Evento } from "@/lib/types";

export type AperturaBadgeKind =
  | "abierta_hoy"
  | "abierta_ayer"
  | "recien_abierta"
  | null;

/** Javier 2026-09-15: máx 3 días civiles desde `fecha_apertura_inscripcion` (Europe/Madrid). */
export const RECIEN_ABIERTA_MAX_DAYS = 3;

type EventoApertura = Pick<
  Evento,
  "id_canonico" | "etiquetas" | "fecha_apertura_inscripcion"
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
  if (days >= 2 && days <= RECIEN_ABIERTA_MAX_DAYS) return "recien_abierta";
  return null;
}

/**
 * Badge de apertura solo con `fecha_apertura_inscripcion` (Europe/Madrid).
 * Día 0 = Abierta hoy; 1 = Abierta ayer; 2–3 = 🔥; ≥4 o sin fecha = nada.
 * Ignora etiquetas y el boolean `recien_abierta` (pueden quedar de fecha_hallazgo).
 * Embargo VIP+24h sigue ganando (hero / strip / 🔥).
 */
export function resolveAperturaBadge(
  event: EventoApertura,
  now = new Date(),
): AperturaBadgeKind {
  if (event.id_canonico && isHighlightEmbargoed(event.id_canonico, now)) {
    return null;
  }

  const fecha = event.fecha_apertura_inscripcion;
  if (!fecha) return null;

  const days = daysSinceApertura(fecha, now);
  if (days === null || days < 0 || days > RECIEN_ABIERTA_MAX_DAYS) return null;
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
