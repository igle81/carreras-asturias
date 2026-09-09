import type { Metadata } from "next";
import { disciplineLabelForEvent } from "./disciplines";
import { formatRangoFecha } from "./dates";
import { modalidadLabel } from "./modalidad";
import type { Evento } from "./types";

/** Canonical public origin. Vercel 308s apex → www; sitemap/canonicals must not redirect. */
export const SITE_URL = "https://www.carrerasasturias.es";
export const SITE_NAME = "Carreras Asturias";

export const DEFAULT_TITLE = "Carreras Asturias · Calendario de trail, running y ciclismo";

export const DEFAULT_DESCRIPTION =
  "Calendario vivo de carreras a pie y ciclismo en Asturias. Trail, asfalto, running, MTB, BTT, carretera, enduro e inscripciones recién abiertas por concejo.";

export const DEFAULT_KEYWORDS = [
  "carreras Asturias",
  "trail Asturias",
  "running Asturias",
  "ciclismo Asturias",
  "MTB Asturias",
  "BTT Asturias",
  "calendario carreras",
  "inscripciones trail",
  "carreras a pie",
  "enduro Asturias",
  "cicloturismo Asturias",
];

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function parseEventDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00Z`)
    : new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function eventPath(id: string): string {
  return `/evento/${id}`;
}

export function eventDescription(event: Evento): string {
  const when = formatRangoFecha(event.fecha_inicio, event.fecha_fin);
  const where = event.municipio ?? event.localidad ?? "Asturias";
  const discipline = disciplineLabelForEvent(event);
  return `${event.nombre} en ${where}. ${when}. ${modalidadLabel(event)} · ${discipline}.`;
}

export function pageMetadata({
  title,
  description,
  path,
  keywords,
  absoluteTitle,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  absoluteTitle?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}

export function eventMetadata(event: Evento): Metadata {
  const path = eventPath(event.id_canonico);
  const url = absoluteUrl(path);
  const description = eventDescription(event);
  const keywords = [
    event.nombre,
    event.municipio,
    event.localidad,
    disciplineLabelForEvent(event),
    modalidadLabel(event),
    "Asturias",
  ].filter((value): value is string => Boolean(value));

  const image = event.imagen_url ?? undefined;

  return {
    title: event.nombre,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url,
      siteName: SITE_NAME,
      title: event.nombre,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: event.nombre,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

type JsonLd = Record<string, unknown>;

const SCHEMA = "https://schema.org";

function trimmed(value: string | null | undefined): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}

/** ISO date (YYYY-MM-DD) for all-day events. Do not invent a start hour. */
export function schemaDay(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const ymd = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : undefined;
}

function tagSet(event: Evento): Set<string> {
  return new Set((event.etiquetas ?? []).map((tag) => tag.toLocaleLowerCase("es")));
}

/**
 * Event lifecycle for Google, not inscripción state.
 * Default EventScheduled; cancelled/postponed only from explicit labels.
 */
export function eventStatusJsonLd(event: Evento): string {
  const haystack = [
    event.estado_inscripcion,
    ...(event.etiquetas ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("es");

  if (/\b(cancelad[oa]|anulad[oa])\b/.test(haystack)) {
    return `${SCHEMA}/EventCancelled`;
  }
  if (/\b(aplazad[oa]|pospuest[oa]|postponed)\b/.test(haystack)) {
    return `${SCHEMA}/EventPostponed`;
  }
  return `${SCHEMA}/EventScheduled`;
}

function organizationJsonLd(name: string, url?: string): JsonLd {
  const org: JsonLd = { "@type": "Organization", name };
  if (url) org.url = url;
  return org;
}

function offerAvailability(event: Evento): string | undefined {
  const estado = (event.estado_inscripcion ?? "").toLocaleLowerCase("es");
  if (estado === "abierta") return `${SCHEMA}/InStock`;
  if (estado === "cerrada") return `${SCHEMA}/SoldOut`;
  if (estado === "proximamente") return `${SCHEMA}/PreOrder`;

  const tags = tagSet(event);
  if (tags.has("inscripcion_abierta")) return `${SCHEMA}/InStock`;
  if (tags.has("inscripcion_cerrada")) return `${SCHEMA}/SoldOut`;
  return undefined;
}

export function eventOffersJsonLd(event: Evento): JsonLd | undefined {
  const url = trimmed(event.url_oficial);
  if (!url) return undefined;

  const offer: JsonLd = { "@type": "Offer", url };
  const availability = offerAvailability(event);
  if (availability) offer.availability = availability;

  const validFrom = schemaDay(event.fecha_apertura_inscripcion);
  if (validFrom) offer.validFrom = validFrom;

  if (tagSet(event).has("gratuita")) {
    offer.price = 0;
    offer.priceCurrency = "EUR";
  }

  return offer;
}

function eventPlace(event: Evento): JsonLd | undefined {
  const name = event.localidad ?? event.municipio ?? event.municipio_meta;
  const locality = event.localidad ?? event.municipio;
  const region = event.provincia;
  const hasCoords =
    event.lat != null &&
    event.lng != null &&
    Number.isFinite(event.lat) &&
    Number.isFinite(event.lng);

  if (!name && !locality && !region && !hasCoords) return undefined;

  const address: JsonLd = { "@type": "PostalAddress" };
  if (locality) address.addressLocality = locality;
  if (region) address.addressRegion = region;
  if (name || locality || region) address.addressCountry = "ES";

  const place: JsonLd = { "@type": "Place" };
  if (name) place.name = name;
  if (Object.keys(address).length > 1) place.address = address;
  if (hasCoords) {
    place.geo = {
      "@type": "GeoCoordinates",
      latitude: event.lat,
      longitude: event.lng,
    };
  }
  return place;
}

export function sportsEventJsonLd(event: Evento): JsonLd {
  const officialUrl = trimmed(event.url_oficial);
  const data: JsonLd = {
    "@context": SCHEMA,
    "@type": "SportsEvent",
    name: event.nombre,
    description: eventDescription(event),
    url: absoluteUrl(eventPath(event.id_canonico)),
    inLanguage: "es",
    eventStatus: eventStatusJsonLd(event),
    eventAttendanceMode: `${SCHEMA}/OfflineEventAttendanceMode`,
  };

  const startDate = schemaDay(event.fecha_inicio) ?? trimmed(event.fecha_inicio);
  if (startDate) {
    data.startDate = startDate;
    data.endDate = schemaDay(event.fecha_fin) ?? trimmed(event.fecha_fin) ?? startDate;
  }

  const place = eventPlace(event);
  if (place) data.location = place;

  const organizerName = trimmed(event.organizador);
  if (organizerName) {
    data.organizer = organizationJsonLd(organizerName, officialUrl);
    data.performer = organizationJsonLd(organizerName);
  }

  if (officialUrl) data.sameAs = officialUrl;
  if (event.imagen_url) data.image = event.imagen_url;

  const offers = eventOffersJsonLd(event);
  if (offers) data.offers = offers;

  const sport = disciplineLabelForEvent(event);
  if (sport && sport !== "Carrera") data.sport = sport;

  return data;
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "es",
  };
}
