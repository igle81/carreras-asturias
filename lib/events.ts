import { cache } from "react";
import { daysUntil, isUpcoming, isWithinDays } from "./dates";
import { getSupabase } from "./supabase";
import type { Distancia, Evento } from "./types";

const EVENT_COLUMNS =
  "id_canonico,nombre,fecha_inicio,fecha_fin,municipio,municipio_meta,localidad,provincia,disciplina_normalizada,distancias,organizador,url_oficial,estado_inscripcion,lat,lng,etiquetas,recien_abierta,calidad_score";

const EMBLEMATIC_HINTS = [
  "angliru",
  "media maratón",
  "media maraton",
  "jovellanos",
  "oviedo",
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
    distancias: asDistancias(row.distancias),
    organizador: (row.organizador as string | null) ?? null,
    url_oficial: (row.url_oficial as string | null) ?? null,
    estado_inscripcion: (row.estado_inscripcion as Evento["estado_inscripcion"]) ?? "desconocido",
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    etiquetas: Array.isArray(row.etiquetas) ? (row.etiquetas as string[]) : null,
    recien_abierta: Boolean(row.recien_abierta),
    calidad_score: row.calidad_score == null ? null : Number(row.calidad_score),
  };
}

export const getEventos = cache(async (): Promise<Evento[]> => {
  const { data, error } = await getSupabase()
    .from("eventos")
    .select(EVENT_COLUMNS)
    .order("fecha_inicio", { ascending: true });

  if (error) {
    console.error("No se pudieron cargar los eventos", error.message);
    return [];
  }

  return (data ?? []).map((row) => normalizeEvent(row as Record<string, unknown>));
});

export async function getEvento(id: string): Promise<Evento | null> {
  const events = await getEventos();
  return events.find((event) => event.id_canonico === id) ?? null;
}

export function upcomingEvents(events: Evento[], from = new Date()) {
  return events.filter((event) => isUpcoming(event.fecha_inicio, from));
}

export function recienAbiertas(events: Evento[]) {
  return events.filter((event) => event.recien_abierta);
}

export function estaQuincena(events: Evento[], from = new Date()) {
  return upcomingEvents(events, from).filter((event) =>
    isWithinDays(event.fecha_inicio, 14, from),
  );
}

export function isEmblematic(event: Evento) {
  if ((event.calidad_score ?? 0) >= 0.9) return true;
  const name = event.nombre.toLocaleLowerCase("es");
  return EMBLEMATIC_HINTS.some((hint) => name.includes(hint));
}

function compareHero(a: Evento, b: Evento, from: Date) {
  const bucket = (event: Evento) => {
    const days = daysUntil(event.fecha_inicio, from);
    if (days !== null && days <= 7) return 0;
    if (days !== null && days <= 14) return 1;
    if (isEmblematic(event)) return 2;
    return 3;
  };

  const bucketDiff = bucket(a) - bucket(b);
  if (bucketDiff !== 0) return bucketDiff;

  const recienDiff = Number(Boolean(b.recien_abierta)) - Number(Boolean(a.recien_abierta));
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
      if (item.etiqueta) return item.etiqueta.replaceAll("_", " ");
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
