/**
 * Embargo VIP+24h: fuera de hero / carousel / quincena.
 * El strip Recién abiertas y los badges 🔥 / Abierta hoy|ayer usan solo la
 * ventana de 3 días (`lib/apertura-badge.ts`), sin esperar este embargo.
 * Siguen en listado y calendario. No hay columna `embargo_until` en Supabase;
 * el until va hardcodeado aquí.
 */

/** Strip optional `-{YYYY-MM-DD}-{disciplina}` so short and long ids match. */
const DATE_DISCIPLINE_SUFFIX = /-\d{4}-\d{2}-\d{2}-[a-z0-9]+$/i;

export type HighlightEmbargo = {
  id: string;
  /** ISO con offset. Sin until = embargo permanente (comportamiento legado). */
  until?: string;
};

export const HIGHLIGHT_EMBARGO: HighlightEmbargo[] = [
  { id: "marcha-cicloturista-fiestas-corvera-2026" },
  { id: "fiesta-bicicleta-aviles-2026" },
  // Hero uses short slug; ficha/DB also exposes date+disciplina suffix.
  { id: "desafio-el-acebo-2026" },
  { id: "encuentro-asturcantabro-de-escuelas-2026" },
  {
    id: "xiii-trail-villacabra-2026-2026-12-13-pie",
    until: "2026-09-15T21:00:00+02:00",
  },
];

export function highlightIdKey(id: string) {
  return id.replace(DATE_DISCIPLINE_SUFFIX, "");
}

function idsMatch(embargoId: string, eventId: string) {
  if (embargoId === eventId) return true;
  return highlightIdKey(embargoId) === highlightIdKey(eventId);
}

export function isHighlightEmbargoed(id: string, now = new Date()): boolean {
  const matches = HIGHLIGHT_EMBARGO.filter((entry) => idsMatch(entry.id, id));
  if (!matches.length) return false;
  return matches.some((entry) => {
    if (!entry.until) return true;
    const untilMs = Date.parse(entry.until);
    if (!Number.isFinite(untilMs)) return true;
    return now.getTime() < untilMs;
  });
}
