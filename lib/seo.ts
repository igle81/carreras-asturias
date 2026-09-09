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
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.nombre,
    url: absoluteUrl(eventPath(event.id_canonico)),
    inLanguage: "es",
  };

  if (event.fecha_inicio) data.startDate = event.fecha_inicio;
  if (event.fecha_fin && event.fecha_fin !== event.fecha_inicio) {
    data.endDate = event.fecha_fin;
  }

  const place = eventPlace(event);
  if (place) data.location = place;

  if (event.organizador) {
    data.organizer = { "@type": "Organization", name: event.organizador };
  }
  if (event.url_oficial) data.sameAs = event.url_oficial;
  if (event.imagen_url) data.image = event.imagen_url;

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
