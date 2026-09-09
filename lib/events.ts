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
const EVENT_COLUMNS_WITH_APERTURA = `${EVENT_COLUMNS_WITH_MODALIDAD},fecha_apertura_inscripcion`;
const EVENT_COLUMNS_FULL = `${EVENT_COLUMNS_WITH_APERTURA},imagen_url,imagen_fuente`;

function isMissingAperturaColumn(error: { message?: string } | null): boolean {
  if (!error) return false;
  return (error.message ?? "").toLowerCase().includes("fecha_apertura_inscripcion");
}

function isMissingImagenColumn(error: { message?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return message.includes("imagen_url") || message.includes("imagen_fuente");
}

function asImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

export function eventPosterUrl(event: Pick<Evento, "imagen_url">): string | null {
  return asImageUrl(event.imagen_url);
}

export function eventPosterCredit(event: Pick<Evento, "imagen_fuente">): string | null {
  if (typeof event.imagen_fuente !== "string") return null;
  const trimmed = event.imagen_fuente.trim();
  if (!trimmed || trimmed.length > 40) return null;
  const key = trimmed.toLocaleLowerCase("es");
  if (key === "cartel") return "Cartel";
  if (key.includes(":")) return null;
  return trimmed;
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

/** Embargo VIP+24h: fuera de hero/carousel/quincena. Siguen en listado/calendario. */
const HIGHLIGHT_EMBARGO = [
  "marcha-cicloturista-fiestas-corvera-2026",
  "fiesta-bicicleta-aviles-2026",
];

function isHighlightEmbargoed(id: string) {
  return HIGHLIGHT_EMBARGO.includes(id);
}

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
    imagen_url: asImageUrl(row.imagen_url),
    imagen_fuente:
      typeof row.imagen_fuente === "string" && row.imagen_fuente.trim()
        ? row.imagen_fuente.trim()
        : null,
  };
}

/** Uncached fetch. Use in metadata routes (sitemap) where React `cache()` may not apply. Never throws. */
export async function fetchEventos(): Promise<Evento[]> {
  try {
    const client = getSupabase();

    const withImages = await client
      .from("eventos")
      .select(EVENT_COLUMNS_FULL)
      .order("fecha_inicio", { ascending: true });

    const afterImages =
      withImages.error && isMissingImagenColumn(withImages.error)
        ? await client
            .from("eventos")
            .select(EVENT_COLUMNS_WITH_APERTURA)
            .order("fecha_inicio", { ascending: true })
        : withImages;

    const afterApertura =
      afterImages.error && isMissingAperturaColumn(afterImages.error)
        ? await client
            .from("eventos")
            .select(EVENT_COLUMNS_WITH_MODALIDAD)
            .order("fecha_inicio", { ascending: true })
        : afterImages;

    const result =
      afterApertura.error && isMissingModalidadColumn(afterApertura.error)
        ? await client
            .from("eventos")
            .select(EVENT_COLUMNS)
            .order("fecha_inicio", { ascending: true })
        : afterApertura;

    if (result.error) {
      console.error("No se pudieron cargar los eventos", result.error.message);
      return [];
    }

    return (result.data ?? []).map((row) =>
      normalizeEvent(row as unknown as Record<string, unknown>),
    );
  } catch (error) {
    console.error("No se pudieron cargar los eventos", error);
    return [];
  }
}

export const getEventos = cache(fetchEventos);

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
    if (isHighlightEmbargoed(event.id_canonico)) return false;
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
    .filter((event) => !isHighlightEmbargoed(event.id_canonico))
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
