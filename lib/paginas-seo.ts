/**
 * Páginas SEO de búsquedas reales (15-oct-2026): fin de semana, calendario por
 * mes, trail y concejo. Todo sale de las filas de public.eventos; nada inventado.
 */
import { madridClock } from "@/lib/dates";
import type { Evento } from "@/lib/types";

export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function hoyMadrid(from: Date): Date {
  const c = madridClock(from);
  return new Date(Date.UTC(c.year, c.month - 1, c.day));
}

function sumarDias(date: Date, dias: number): Date {
  return new Date(date.getTime() + dias * 86_400_000);
}

function inicio(e: Evento): string | null {
  return e.fecha_inicio && ISO_RE.test(e.fecha_inicio.slice(0, 10)) ? e.fecha_inicio.slice(0, 10) : null;
}

function fin(e: Evento): string | null {
  const f = e.fecha_fin?.slice(0, 10);
  return f && ISO_RE.test(f) ? f : inicio(e);
}

function porFecha(a: Evento, b: Evento): number {
  return (inicio(a) ?? "").localeCompare(inicio(b) ?? "") || a.nombre.localeCompare(b.nombre, "es");
}

/** Pruebas que se celebran (total o parcialmente) entre dos días ISO, ambos incluidos. */
export function eventosEntre(events: Evento[], desde: string, hasta: string): Evento[] {
  return events
    .filter((e) => {
      const i = inicio(e);
      const f = fin(e);
      return i !== null && f !== null && i <= hasta && f >= desde;
    })
    .sort(porFecha);
}

export type FinDeSemana = { viernes: string; domingo: string };

/** El fin de semana en curso (vie–dom, hora de Madrid) o el siguiente. */
export function finDeSemana(from = new Date(), semanasDespues = 0): FinDeSemana {
  const hoy = hoyMadrid(from);
  const dia = hoy.getUTCDay(); // 0 dom … 6 sáb
  const hastaViernes = dia === 0 ? -2 : dia === 6 ? -1 : 5 - dia;
  const viernes = sumarDias(hoy, hastaViernes + semanasDespues * 7);
  return { viernes: iso(viernes), domingo: iso(sumarDias(viernes, 2)) };
}

/**
 * Pruebas de este fin de semana. Si no hay, las del siguiente (`siguiente: true`).
 */
export function pruebasFinDeSemana(events: Evento[], from = new Date()) {
  const actual = finDeSemana(from);
  const lista = eventosEntre(events, actual.viernes, actual.domingo);
  if (lista.length) return { finde: actual, eventos: lista, siguiente: false };
  const prox = finDeSemana(from, 1);
  return { finde: prox, eventos: eventosEntre(events, prox.viernes, prox.domingo), siguiente: true };
}

/** Agrupa por día ISO (las de varios días van en su día de inicio, o el viernes si empezaron antes). */
export function agruparPorDia(events: Evento[], desde?: string): Array<{ dia: string; eventos: Evento[] }> {
  const mapa = new Map<string, Evento[]>();
  for (const e of events) {
    let dia = inicio(e) ?? "";
    if (desde && dia < desde) dia = desde;
    mapa.set(dia, [...(mapa.get(dia) ?? []), e]);
  }
  return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dia, eventos]) => ({ dia, eventos }));
}

// ---------- Calendario por mes ----------

export type MesSlug = { anio: string; mes: string };

export function mesDeFecha(fecha: string): MesSlug {
  return { anio: fecha.slice(0, 4), mes: MESES[Number(fecha.slice(5, 7)) - 1] };
}

export function numeroMes(mes: string): number | null {
  const i = MESES.indexOf(mes as (typeof MESES)[number]);
  return i < 0 ? null : i + 1;
}

export function eventosDelMes(events: Evento[], anio: string, mes: string): Evento[] {
  const n = numeroMes(mes);
  if (!n || !/^\d{4}$/.test(anio)) return [];
  const pref = `${anio}-${String(n).padStart(2, "0")}`;
  return events.filter((e) => inicio(e)?.startsWith(pref)).sort(porFecha);
}

/** Meses con al menos una prueba, en orden. */
export function mesesConPruebas(events: Evento[]): MesSlug[] {
  const claves = new Set<string>();
  for (const e of events) {
    const i = inicio(e);
    if (i) claves.add(i.slice(0, 7));
  }
  return [...claves].sort().map((k) => mesDeFecha(`${k}-01`));
}

export function mesPath(m: MesSlug): string {
  return `/calendario/${m.anio}/${m.mes}`;
}

export function mesTitulo(m: MesSlug): string {
  return `${m.mes} de ${m.anio}`;
}

/** El mes en curso (Madrid) si tiene pruebas; si no, el siguiente con pruebas. */
export function mesActualOSiguiente(events: Evento[], from = new Date()): MesSlug | null {
  const ahora = iso(hoyMadrid(from)).slice(0, 7);
  return mesesConPruebas(events).find((m) => `${m.anio}-${String(numeroMes(m.mes)).padStart(2, "0")}` >= ahora) ?? null;
}

// ---------- Trail ----------

const DISCIPLINAS_TRAIL = new Set(["trail", "skyrace"]);

export function esTrail(e: Evento): boolean {
  return DISCIPLINAS_TRAIL.has((e.disciplina_normalizada ?? "").toLowerCase());
}

export function pruebasTrail(events: Evento[], anio: string) {
  const delAnio = events.filter((e) => esTrail(e) && inicio(e)?.startsWith(anio));
  return delAnio.sort(porFecha);
}

/** Año que toca para /trail: el actual en Madrid. */
export function anioActual(from = new Date()): string {
  return String(madridClock(from).year);
}

// ---------- Concejo ----------

export function slugConcejo(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Concejo de cada prueba a partir de `municipio`. En «A (B)», si B es un concejo
 * que ya aparece solo en los datos (Luarca (Valdés)), se usa B; si no, A
 * (Mieres (Figaredo)).
 */
export function concejosDe(events: Evento[]): Map<string, { nombre: string; eventos: Evento[] }> {
  const limpios = new Set(
    events.map((e) => e.municipio?.trim() ?? "").filter((m) => m && !m.includes("(")),
  );
  const out = new Map<string, { nombre: string; eventos: Evento[] }>();
  for (const e of events) {
    const m = e.municipio?.trim();
    if (!m) continue;
    const par = /^(.+?)\s*\((.+)\)$/.exec(m);
    const nombre = par ? (limpios.has(par[2].trim()) ? par[2].trim() : par[1].trim()) : m;
    const slug = slugConcejo(nombre);
    if (!slug) continue;
    const actual = out.get(slug) ?? { nombre, eventos: [] };
    actual.eventos.push(e);
    out.set(slug, actual);
  }
  for (const v of out.values()) v.eventos.sort(porFecha);
  return out;
}

export function concejoPath(slug: string): string {
  return `/concejo/${slug}`;
}

/** Separa próximas (fin ≥ hoy) y ya celebradas (más recientes primero). */
export function proximasYPasadas(events: Evento[], from = new Date()) {
  const hoy = iso(hoyMadrid(from));
  const proximas = events.filter((e) => (fin(e) ?? "") >= hoy).sort(porFecha);
  const pasadas = events.filter((e) => (fin(e) ?? "9999") < hoy).sort((a, b) => porFecha(b, a));
  return { proximas, pasadas };
}
