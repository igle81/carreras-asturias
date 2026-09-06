import { cache } from "react";
import { hasAperturaReciente } from "./apertura-badge";
import { daysUntil, isUpcoming, isWithinDays } from "./dates";
import { disciplineLabel } from "./disciplines";
import { isMissingModalidadColumn, resolveModalidad } from "./modalidad";
import { getSupabase } from "./supabase";
import type { Distancia, Evento } from "./types";

const EVENT_COLUMNS =
  "id_canonico,nombre,fecha_inicio,fecha_fin,municipio,municipio_meta,localidad,provincia,disciplina_normalizada,distancias,organizador,url_oficial,estado_inscripcion,lat,lng,etiquetas,recien_abierta,calidad_score";
const EVENT_COLUMNS_WITH_MODALIDAD = `${EVENT_COLUMNS},modalidad`;
const EVENT_COLUMNS_FULL = `${EVENT_COLUMNS_WITH_MODALIDAD},fecha_apertura_inscripcion`;

function isMissingAperturaColumn(error: { message?: string } | null): boolean {
  if (!error) return false;
  return (error.message ?? "").toLowerCase().includes("fecha_apertura_inscripcion");
}

const EMBLEMATIC_HINTS = [
  "angliru",
  "media maratón",
  "media maraton",
  "jovellanos",
  "oviedo",
];

const HERO_PINNED = [
  "enduro-degollada-open-endurastur-2026",
  "cicloturista-el-gamoniteiro-2026",
];

const QUINCENA_FEATURED = [
  "marcha-solidaria-monteareo-btt-2026",
  "quedada-btt-san-martin-de-luina-2026",
  "marcha-solidaria-rober-contra-el-cancer-2026",
];

function asDistancias(value: unknown): Distancia[] | null {
  if (!Array.isArray(value)) return null;
  const distances: Distancia[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const parsedKm = typeof row.km === "number" ? row.km : Number(row.km);
    const distance: Distancia = {
      km: Number.isFinite(parsedKm) ? parsedKm : undefined,
      etiqueta: typeof row.etiqueta === "string" ? row.etiqueta : undefined,
    };
    if (distance.km || distance.etiqueta) distances.push(distance);
  }
  return distances.length ? distances : null;
}

function normalizeEvent(row: Record<string, unknown>): Evento {
  return {
    id_canonico: String(row.id_canonico),
    nombre: String(row.nombre ?? "Carrera"),
    fecha_inicio: (row.fecha_inicio as string | null) ?? null,
    fecha_fin: (row.fecha_fin as string | null) ?? null,
    municipio: (row.municipio as string | null) ?? null,
    municipio_meta: (row.municipio_meta as string | null) ?? null,
    localidad: (row.localidad as string | null) ?? null,
    provincia: (row.provincia as string | null) ?? null,
    disciplina_normalizada: (row.disciplina_normalizada as string | null) ?? null,
    modalidad: typeof row.modalidad === "string" && row.modalidad.trim() ? row.modalidad : null,
    distancias: asDistancias(row.distancias),
    organizador: (row.organizador as string | null) ?? null,
    url_oficial: (row.url_oficial as string | null) ?? null,
    estado_inscripcion: (row.estado_inscripcion as Evento["estado_inscripcion"]) ?? "desconocido",
    fecha_apertura_inscripcion:
      typeof row.fecha_apertura_inscripcion === "string" && row.fecha_apertura_inscripcion.trim()
        ? row.fecha_apertura_inscripcion
        : null,
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    etiquetas: Array.isArray(row.etiquetas) ? (row.etiquetas as string[]) : null,
    recien_abierta: Boolean(row.recien_abierta),
    calidad_score: row.calidad_score == null ? null : Number(row.calidad_score),
  };
}

export const getEventos = cache(async (): Promise<Evento[]> => {
  const client = getSupabase();
  const query = (columns: string) =>
    client.from("eventos").select(columns).order("fecha_inicio", { ascending: true });

  let result = await query(EVENT_COLUMNS_FULL);
  if (result.error && isMissingAperturaColumn(result.error)) {
    result = await query(EVENT_COLUMNS_WITH_MODALIDAD);
  }
  if (result.error && isMissingModalidadColumn(result.error)) {
    result = await query(EVENT_COLUMNS);
  }

  if (result.error) {
    console.error("No se pudieron cargar los eventos", result.error.message);
    return [];
  }

  return (result.data ?? []).map((row) => normalizeEvent(row as Record<string, unknown>));
});

export async function getEvento(id: string): Promise<Evento | null> {
  const events = await getEventos();
  return events.find((event) => event.id_canonico === id) ?? null;
}

export function upcomingEvents(events: Evento[], from = new Date()) {
  return events.filter((event) => isUpcoming(event.fecha_inicio, from));
}

export function recienAbiertas(events: Evento[]) {
  return events.filter((event) => hasAperturaReciente(event));
}

export function estaQuincena(events: Evento[], from = new Date()) {
  return upcomingEvents(events, from).filter((event) => {
    if (isWithinDays(event.fecha_inicio, 14, from)) return true;
    return QUINCENA_FEATURED.includes(event.id_canonico) && isWithinDays(event.fecha_inicio, 16, from);
  });
}

export function isEmblematic(event: Evento) {
  if ((event.calidad_score ?? 0) >= 0.9) return true;
  const name = event.nombre.toLocaleLowerCase("es");
  return EMBLEMATIC_HINTS.some((hint) => name.includes(hint));
}

function isCiclismoUrgente(event: Evento, from: Date) {
  if (resolveModalidad(event) !== "ciclismo") return false;
  if (!isWithinDays(event.fecha_inicio, 14, from)) return false;
  return hasAperturaReciente(event) || event.estado_inscripcion === "abierta";
}

function compareHero(a: Evento, b: Evento, from: Date) {
  const bucket = (event: Evento) => {
    if (HERO_PINNED.includes(event.id_canonico)) return -1;
    const days = daysUntil(event.fecha_inicio, from);
    if (days !== null && days <= 7) return 0;
    if (isCiclismoUrgente(event, from)) return 1;
    if (days !== null && days <= 14) return 2;
    if (isEmblematic(event)) return 3;
    return 4;
  };

  const bucketDiff = bucket(a) - bucket(b);
  if (bucketDiff !== 0) return bucketDiff;

  const pinDiff = Number(HERO_PINNED.includes(b.id_canonico)) - Number(HERO_PINNED.includes(a.id_canonico));
  if (pinDiff !== 0) return pinDiff;
  const pinOrder = HERO_PINNED.indexOf(a.id_canonico) - HERO_PINNED.indexOf(b.id_canonico);
  if (HERO_PINNED.includes(a.id_canonico) && HERO_PINNED.includes(b.id_canonico) && pinOrder !== 0) {
    return pinOrder;
  }

  const recienDiff = Number(hasAperturaReciente(b)) - Number(hasAperturaReciente(a));
  if (recienDiff !== 0) return recienDiff;

  const daysA = daysUntil(a.fecha_inicio, from) ?? 9999;
  const daysB = daysUntil(b.fecha_inicio, from) ?? 9999;
  if (daysA !== daysB) return daysA - daysB;

  return (b.calidad_score ?? 0) - (a.calidad_score ?? 0);
}

export function pickHeroSlides(events: Evento[], from = new Date(), max = 6): Evento[] {
  return [...upcomingEvents(events, from)]
    .sort((a, b) => compareHero(a, b, from))
    .slice(0, max);
}

export function formatDistancias(event: Evento): string | null {
  if (!event.distancias?.length) return null;
  return event.distancias
    .map((item) => {
      if (item.etiqueta) return disciplineLabel(item.etiqueta);
      if (item.km) return `${Number.isInteger(item.km) ? item.km : item.km.toFixed(1)} km`;
      return null;
    })
    .filter(Boolean)
    .join(" · ");
}

export function eventCta(event: Evento): {
  label: string;
  href: string;
  external: boolean;
} {
  const ficha = `/evento/${event.id_canonico}`;
  const estado = event.estado_inscripcion ?? "desconocido";

  if (estado === "abierta" && event.url_oficial) {
    return { label: "Inscribirme", href: event.url_oficial, external: true };
  }
  if (estado === "cerrada") {
    return { label: "Ver ficha", href: ficha, external: false };
  }
  if (event.url_oficial) {
    return { label: "Consultar inscripción", href: event.url_oficial, external: true };
  }
  return { label: "Ver ficha", href: ficha, external: false };
}
