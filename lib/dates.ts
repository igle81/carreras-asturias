export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(isoDate: string | null, from = new Date()): number | null {
  if (!isoDate) return null;
  const start = startOfDay(from).getTime();
  const target = startOfDay(parseISODate(isoDate)).getTime();
  return Math.round((target - start) / 86_400_000);
}

export function isWithinDays(isoDate: string | null, maxDays: number, from = new Date()) {
  const delta = daysUntil(isoDate, from);
  return delta !== null && delta >= 0 && delta <= maxDays;
}

/** Fecha de inicio ≥ hoy. Sin tope de meses ni año civil: 2027 cuenta. */
export function isUpcoming(isoDate: string | null, from = new Date()) {
  const delta = daysUntil(isoDate, from);
  return delta !== null && delta >= 0;
}

/** Día civil y hora en Europe/Madrid (los barridos van en esta zona). */
export function madridClock(from = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(from).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** Días hasta una fecha ISO (YYYY-MM-DD) usando el calendario de Madrid. */
export function daysUntilMadrid(isoDate: string | null, from = new Date()): number | null {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const now = madridClock(from);
  const start = Date.UTC(now.year, now.month - 1, now.day);
  const target = Date.UTC(year, month - 1, day);
  return Math.round((target - start) / 86_400_000);
}

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function formatFechaHumana(isoDate: string | null): string {
  if (!isoDate) return "Fecha por confirmar";
  const date = parseISODate(isoDate);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function formatFechaCorta(isoDate: string | null): string {
  if (!isoDate) return "TBD";
  const date = parseISODate(isoDate);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatRangoFecha(inicio: string | null, fin: string | null): string {
  if (!inicio) return "Fecha por confirmar";
  if (!fin || fin === inicio) return formatFechaHumana(inicio);
  return `${formatFechaCorta(inicio)} – ${formatFechaHumana(fin)}`;
}
