import { cache } from "react";
import { hasAperturaReciente } from "./apertura-badge";
import { daysUntil, isUpcoming, isWithinDays } from "./dates";
import { disciplineLabel } from "./disciplines";
import { isHighlightEmbargoed } from "./highlight-embargo";
import { isMissingModalidadColumn, resolveModalidad } from "./modalidad";
import {
  hidePortalDuplicates,
  resolveCanonicalEventId,
} from "./portal-dedupe";
import { postCarreraCta } from "./post-carrera";
import { getSupabase } from "./supabase";
import type { Distancia, Evento } from "./types";

export { compareListedEvents, listedEvents } from "./post-carrera";

const EVENT_COLUMNS =
  "id_canonico,nombre,fecha_inicio,fecha_fin,municipio,municipio_meta,localidad,provincia,disciplina_normalizada,distancias,organizador,url_oficial,estado_inscripcion,lat,lng,etiquetas,recien_abierta,calidad_score";
const EVENT_COLUMNS_WITH_MODALIDAD = `${EVENT_COLUMNS},modalidad`;
const EVENT_COLUMNS_WITH_APERTURA = `${EVENT_COLUMNS_WITH_MODALIDAD},fecha_apertura_inscripcion`;
const EVENT_COLUMNS_FULL = `${EVENT_COLUMNS_WITH_APERTURA},imagen_url,imagen_fuente`;
const EVENT_COLUMNS_FULL_EXTRAS = `${EVENT_COLUMNS_FULL},hora_apertura_inscripcion,apertura_inscripcion_at,url_inscripcion`;
const EVENT_COLUMNS_WITH_CLASIFICACION = `${EVENT_COLUMNS_FULL_EXTRAS},url_clasificacion,estado_clasificacion,fuente_clasificacion`;
const EVENT_COLUMNS_WITH_DUPLICADO = `${EVENT_COLUMNS_WITH_CLASIFICACION},duplicado_de`;

function isMissingAperturaColumn(error: { message?: string } | null): boolean {
  if (!error) return false;
  return (error.message ?? "").toLowerCase().includes("fecha_apertura_inscripcion");
}

function isMissingImagenColumn(error: { message?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return message.includes("imagen_url") || message.includes("imagen_fuente");
}

function isMissingClasificacionColumn(error: { message?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("url_clasificacion") ||
    message.includes("estado_clasificacion") ||
    message.includes("fuente_clasificacion")
  );
}

function isMissingDuplicadoColumn(error: { message?: string } | null): boolean {
  if (!error) return false;
  return (error.message ?? "").toLowerCase().includes("duplicado_de");
}

function isMissingAperturaExtraColumn(error: { message?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("hora_apertura_inscripcion") ||
    message.includes("apertura_inscripcion_at") ||
    message.includes("url_inscripcion")
  );
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

function kmFromDistanceLabel(label: string): number | undefined {
  const km = label.match(/(\d+(?:[.,]\d+)?)\s*(?:km|k)\b/i);
  if (km) {
    const parsed = Number(km[1].replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  const coded = label.match(/\bk(\d+(?:[.,]\d+)?)\b/i);
  if (!coded) return undefined;
  const parsed = Number(coded[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asDistanciasFromString(value: string): Distancia[] | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("[")) {
    try {
      return asDistancias(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }
  const distances: Distancia[] = [];
  for (const part of trimmed.split(/\s*(?:\/|,|;)\s*/)) {
    const etiqueta = part.trim();
    if (!etiqueta) continue;
    distances.push({ km: kmFromDistanceLabel(etiqueta), etiqueta });
  }
  return distances.length ? distances : null;
}

function asDistancias(value: unknown): Distancia[] | null {
  if (typeof value === "string") return asDistanciasFromString(value);
  if (!Array.isArray(value)) return null;
  const distances: Distancia[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const parsed = asDistanciasFromString(item);
      if (parsed) distances.push(...parsed);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const parsedKm = typeof row.km === "number" ? row.km : Number(row.km);
    const etiqueta = typeof row.etiqueta === "string" ? row.etiqueta : undefined;
    const distance: Distancia = {
      km: Number.isFinite(parsedKm) ? parsedKm : kmFromDistanceLabel(etiqueta ?? ""),
      etiqueta,
    };
    if (distance.km || distance.etiqueta) distances.push(distance);
  }
  return distances.length ? distances : null;
}

function asOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeEvent(row: Record<string, unknown>): Evento {
  const idCanonico = String(row.id_canonico);
  const fechaApertura = asOptionalText(row.fecha_apertura_inscripcion);
  const horaApertura = asOptionalText(row.hora_apertura_inscripcion);
  const aperturaAt = asOptionalText(row.apertura_inscripcion_at);
  const estado = (row.estado_inscripcion as Evento["estado_inscripcion"]) ?? "desconocido";
  const dbRecien = row.recien_abierta === true;
  const apertura = {
    fecha_apertura_inscripcion: fechaApertura,
    hora_apertura_inscripcion: horaApertura,
    apertura_inscripcion_at: aperturaAt,
    estado_inscripcion: estado,
    recien_abierta: dbRecien,
  };
  return {
    id_canonico: idCanonico,
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
    url_inscripcion: asImageUrl(row.url_inscripcion),
    estado_inscripcion: estado,
    fecha_apertura_inscripcion: fechaApertura,
    hora_apertura_inscripcion: horaApertura,
    apertura_inscripcion_at: aperturaAt,
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    etiquetas: Array.isArray(row.etiquetas) ? (row.etiquetas as string[]) : null,
    recien_abierta: hasAperturaReciente(apertura),
    calidad_score: row.calidad_score == null ? null : Number(row.calidad_score),
    imagen_url: asImageUrl(row.imagen_url),
    imagen_fuente:
      typeof row.imagen_fuente === "string" && row.imagen_fuente.trim()
        ? row.imagen_fuente.trim()
        : null,
    url_clasificacion: asImageUrl(row.url_clasificacion),
    estado_clasificacion:
      typeof row.estado_clasificacion === "string" && row.estado_clasificacion.trim()
        ? row.estado_clasificacion.trim()
        : null,
    fuente_clasificacion:
      typeof row.fuente_clasificacion === "string" && row.fuente_clasificacion.trim()
        ? row.fuente_clasificacion.trim()
        : null,
    duplicado_de:
      typeof row.duplicado_de === "string" && row.duplicado_de.trim()
        ? row.duplicado_de.trim()
        : null,
  };
}

/** Uncached fetch. Use in the sitemap route where React `cache()` may not apply. Never throws. */
export async function fetchEventos(): Promise<Evento[]> {
  try {
    const client = getSupabase();

    const withDuplicado = await client
      .from("eventos")
      .select(EVENT_COLUMNS_WITH_DUPLICADO)
      .order("fecha_inicio", { ascending: true });

    const withClasificacion =
      withDuplicado.error &&
      (isMissingDuplicadoColumn(withDuplicado.error) ||
        isMissingAperturaExtraColumn(withDuplicado.error))
        ? await client
            .from("eventos")
            .select(
              isMissingAperturaExtraColumn(withDuplicado.error)
                ? `${EVENT_COLUMNS_FULL},url_clasificacion,estado_clasificacion,fuente_clasificacion,duplicado_de`
                : EVENT_COLUMNS_WITH_CLASIFICACION,
            )
            .order("fecha_inicio", { ascending: true })
        : withDuplicado;

    const withImages =
      withClasificacion.error && isMissingClasificacionColumn(withClasificacion.error)
        ? await client
            .from("eventos")
            .select(EVENT_COLUMNS_FULL_EXTRAS)
            .order("fecha_inicio", { ascending: true })
        : withClasificacion.error && isMissingDuplicadoColumn(withClasificacion.error)
        ? await client
            .from("eventos")
            .select(EVENT_COLUMNS_WITH_CLASIFICACION)
            .order("fecha_inicio", { ascending: true })
        : withClasificacion;

    const afterImages =
      withImages.error && isMissingAperturaExtraColumn(withImages.error)
        ? await client
            .from("eventos")
            .select(EVENT_COLUMNS_FULL)
            .order("fecha_inicio", { ascending: true })
        : withImages.error && isMissingImagenColumn(withImages.error)
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

    return hidePortalDuplicates(
      (result.data ?? []).map((row) =>
        normalizeEvent(row as unknown as Record<string, unknown>),
      ),
    );
  } catch (error) {
    console.error("No se pudieron cargar los eventos", error);
    return [];
  }
}

export const getEventos = cache(fetchEventos);

export async function getEvento(id: string): Promise<Evento | null> {
  const events = await getEventos();
  const canonical = resolveCanonicalEventId(id, events);
  return events.find((event) => event.id_canonico === canonical) ?? null;
}

export function upcomingEvents(events: Evento[], from = new Date()) {
  return hidePortalDuplicates(events).filter((event) => isUpcoming(event.fecha_inicio, from));
}

/** Strip Recién abiertas: solo ventana 3d por fecha. No espera Multicanal VIP+24h. */
export function recienAbiertas(events: Evento[], from = new Date()) {
  return hidePortalDuplicates(events).filter((event) => hasAperturaReciente(event, from));
}

export function estaQuincena(events: Evento[], from = new Date()) {
  return upcomingEvents(events, from).filter((event) => {
    if (isHighlightEmbargoed(event.id_canonico, from)) return false;
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
  return hasAperturaReciente(event, from) || event.estado_inscripcion === "abierta";
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

  const recienDiff = Number(hasAperturaReciente(b, from)) - Number(hasAperturaReciente(a, from));
  if (recienDiff !== 0) return recienDiff;

  const daysA = daysUntil(a.fecha_inicio, from) ?? 9999;
  const daysB = daysUntil(b.fecha_inicio, from) ?? 9999;
  if (daysA !== daysB) return daysA - daysB;

  return (b.calidad_score ?? 0) - (a.calidad_score ?? 0);
}

export function pickHeroSlides(events: Evento[], from = new Date(), max = 6): Evento[] {
  return [...upcomingEvents(events, from)]
    .filter((event) => !isHighlightEmbargoed(event.id_canonico, from))
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

export function inscriptionUrl(event: Pick<Evento, "url_inscripcion" | "url_oficial">): string | null {
  return asImageUrl(event.url_inscripcion) ?? asImageUrl(event.url_oficial);
}

export function eventCta(event: Evento): {
  label: string;
  href: string;
  external: boolean;
} {
  const afterRace = postCarreraCta(event);
  if (afterRace) return afterRace;

  const ficha = `/evento/${event.id_canonico}`;
  const estado = event.estado_inscripcion ?? "desconocido";
  const href = inscriptionUrl(event);

  if (estado === "abierta" && href) {
    return { label: "Inscribirme", href, external: true };
  }
  if (estado === "cerrada") {
    return { label: "Ver ficha", href: ficha, external: false };
  }
  if (href) {
    return { label: "Consultar inscripción", href, external: true };
  }
  return { label: "Ver ficha", href: ficha, external: false };
}
