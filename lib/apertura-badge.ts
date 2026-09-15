import { madridWallToUtc } from "@/lib/fin-estimado";
import type { Evento } from "@/lib/types";

export type AperturaBadgeKind =
  | "abierta_hoy"
  | "abierta_ayer"
  | "recien_abierta"
  | null;

/** Javier 2026-09-15: máx 3 días civiles desde `fecha_apertura_inscripcion` (Europe/Madrid). */
export const RECIEN_ABIERTA_MAX_DAYS = 3;

const PENDING_ESTADOS = new Set(["cerrada_pendiente_apertura", "proximamente"]);

export type EventoApertura = Pick<
  Evento,
  | "fecha_apertura_inscripcion"
  | "hora_apertura_inscripcion"
  | "apertura_inscripcion_at"
  | "estado_inscripcion"
  | "recien_abierta"
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

function parseHoraParts(value: string | null | undefined): { hour: number; minute: number } | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Instante de apertura: `apertura_inscripcion_at`, o fecha + hora Europe/Madrid. */
export function resolveAperturaInstant(event: EventoApertura): Date | null {
  const at = event.apertura_inscripcion_at?.trim();
  if (at) {
    const parsed = new Date(at);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fecha = event.fecha_apertura_inscripcion?.slice(0, 10);
  const hora = parseHoraParts(event.hora_apertura_inscripcion);
  if (!fecha || !hora) return null;
  return madridWallToUtc(fecha, hora.hour, hora.minute);
}

function estadoKey(event: EventoApertura): string {
  return (event.estado_inscripcion ?? "").trim().toLocaleLowerCase("es");
}

/**
 * Kangas 2026-09-15: no hay badge «Abierta hoy|ayer|recién» mientras la
 * inscripción no haya abierto de verdad (hora / estado / flag de fila).
 */
export function inscriptionOpenForHighlight(event: EventoApertura, now = new Date()): boolean {
  const instant = resolveAperturaInstant(event);
  if (instant && now.getTime() < instant.getTime()) return false;

  const estado = estadoKey(event);
  if (estado === "abierta") return true;
  if (event.recien_abierta === true) return true;
  if (PENDING_ESTADOS.has(estado)) return false;
  return true;
}

export function isInscripcionPendienteApertura(event: EventoApertura, now = new Date()): boolean {
  if (estadoKey(event) !== "cerrada_pendiente_apertura") return false;
  const instant = resolveAperturaInstant(event);
  if (instant && now.getTime() >= instant.getTime() && event.recien_abierta === true) {
    return false;
  }
  return true;
}

export function formatHoraApertura(value: string | null | undefined): string | null {
  const parts = parseHoraParts(value);
  if (!parts) return null;
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function inscripcionPendienteLabel(event: EventoApertura, now = new Date()): string | null {
  if (!isInscripcionPendienteApertura(event, now)) return null;
  const hora = formatHoraApertura(event.hora_apertura_inscripcion);
  const fecha = event.fecha_apertura_inscripcion?.slice(0, 10);
  const instant = resolveAperturaInstant(event);
  if (instant && now.getTime() >= instant.getTime()) {
    return "Inscripción pendiente de apertura";
  }
  if (hora && fecha && daysSinceApertura(fecha, now) === 0) {
    return `Abre hoy a las ${hora}`;
  }
  if (hora) return `Abre a las ${hora}`;
  return "Inscripción pendiente de apertura";
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
 * Badge de apertura: ventana ≤3 días desde `fecha_apertura_inscripcion` (Europe/Madrid).
 * Día 0 = Abierta hoy; 1 = Abierta ayer; 2–3 = 🔥; ≥4 o sin fecha = nada.
 * No pinta si la hora/instante de apertura es futuro, ni si el estado sigue
 * `cerrada_pendiente_apertura` / `proximamente` (salvo `recien_abierta` de fila).
 * El boolean `recien_abierta` no alarga la ventana de 3 días.
 * El strip Recién abiertas NO espera embargo VIP+24h.
 */
export function resolveAperturaBadge(
  event: EventoApertura,
  now = new Date(),
): AperturaBadgeKind {
  const fecha = event.fecha_apertura_inscripcion;
  if (!fecha) return null;
  if (!inscriptionOpenForHighlight(event, now)) return null;

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
