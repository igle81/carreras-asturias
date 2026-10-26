import type { Metadata } from "next";
import { disciplineLabel, disciplineLabelForEvent } from "./disciplines";
import { formatRangoFecha } from "./dates";
import { modalidadLabel } from "./modalidad";
import type { Evento } from "./types";

/** Canonical public origin. Vercel 308s apex → www; sitemap/canonicals must not redirect. */
export const SITE_URL = "https://www.carrerasasturias.es";
export const SITE_NAME = "Carreras Asturias";

export const DEFAULT_TITLE = "Carreras Asturias: calendario de trail, running y ciclismo";

export const DEFAULT_DESCRIPTION =
  "Calendario de carreras en Asturias 2026: trail, running, ciclismo y montaña por concejo y fecha. Inscripciones, recorridos y próximas pruebas.";

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

/** og:image 1200×630 generada en app/opengraph-image.tsx (plan SEO parte A). */
export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Carreras Asturias: calendario de trail, running y ciclismo" };

const TITLE_MAX = 60;
const PALABRAS_COLGANTES = new Set(["de", "del", "la", "las", "el", "los", "en", "y", "a", "al", "por", "para", "con", "e", "o", "u"]);

/** Recorta por palabras completas a ≤60 caracteres, sin dejar preposiciones o signos colgando. */
export function recortarTitulo(title: string, max = TITLE_MAX): string {
  const limpio = title.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const palabras = limpio.split(" ");
  const out: string[] = [];
  for (const palabra of palabras) {
    if ([...out, palabra].join(" ").length + 1 > max) break; // +1 para «…»
    out.push(palabra);
  }
  while (out.length > 1) {
    const ultima = out[out.length - 1].replace(/[\s.,;:·–—-]+$/u, "");
    if (!ultima || PALABRAS_COLGANTES.has(ultima.toLocaleLowerCase("es"))) {
      out.pop();
      continue;
    }
    out[out.length - 1] = ultima;
    break;
  }
  if (!out.length) return limpio.slice(0, max - 1).trimEnd() + "…";
  return `${out.join(" ")}…`;
}

/**
 * Versión corta del nombre para el <title> (el H1 conserva el nombre completo):
 * 1) sin paréntesis ni subtítulos entre comillas; 2) solo la parte antes de « — », « – », « / » o « - »;
 * 3) sin «en favor de la…»/«a beneficio de…»; 4) si aún no cabe, recorte por palabras.
 */
export function nombreCorto(title: string, max = TITLE_MAX): string {
  let t = title.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const pasos: Array<(s: string) => string> = [
    (s) => s.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim(),
    (s) => s.replace(/\s*["«“][^"»”]*["»”]\s*/g, " ").replace(/\s+/g, " ").trim(),
    (s) => s.split(/\s+[—–/-]\s+/)[0].trim(),
    (s) => s.replace(/\s+(en favor|a beneficio) de( la| las| los| el)?\s+/i, " ").trim(),
  ];
  for (const paso of pasos) {
    const r = paso(t);
    if (r.length >= 12) t = r;
    if (t.length <= max) return t;
  }
  return recortarTitulo(t, max);
}

/** ≤60 caracteres: con « · Carreras Asturias» si cabe; si no, el nombre (acortado si hace falta). */
export function titleWithSite(title: string): string {
  const full = `${title} · ${SITE_NAME}`;
  if (full.length <= TITLE_MAX) return full;
  if (title.length <= TITLE_MAX) return title.trim();
  const corto = nombreCorto(title);
  const conSitio = `${corto} · ${SITE_NAME}`;
  return conSitio.length <= TITLE_MAX ? conSitio : corto;
}

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

/** Meta description de /correr (140-150 caracteres; SEO 26-10-2026). */
export const CORRER_DESCRIPTION =
  "Calendario de carreras a pie en Asturias: trail, asfalto, cross y running. Inscripciones recién abiertas, mapa por concejo y fichas de cada prueba.";

/** Límites de la meta description de las fichas (SEO 26-10-2026). */
export const DESCRIPCION_MIN = 140;
export const DESCRIPCION_MAX = 150;

/** Distancias reales del evento («10 km, 5 km»); null si no hay. Mismo criterio que formatDistancias. */
function distanciasTexto(event: Evento): string | null {
  const partes = (event.distancias ?? [])
    .map((item) => {
      if (item.etiqueta) return disciplineLabel(item.etiqueta);
      if (item.km) return `${Number.isInteger(item.km) ? item.km : item.km.toFixed(1)} km`;
      return null;
    })
    .filter((v): v is string => Boolean(v));
  return partes.length ? partes.join(", ") : null;
}

/** Año de la fecha de inicio (YYYY), solo si la fecha es válida. */
function anioEvento(event: Evento): string | null {
  const m = /^(\d{4})-\d{2}-\d{2}/.exec(event.fecha_inicio?.trim() ?? "");
  return m ? m[1] : null;
}

/**
 * Coletillas sin datos del evento (nada que pueda faltar en la ficha).
 * Se prueban de más larga a más corta para dejar la descripción entre 140 y 150 caracteres.
 */
const COLETILLAS = [
  " Consulta la ficha completa en el calendario de carreras y pruebas de Carreras Asturias.",
  " Consulta la ficha completa en el calendario de Carreras Asturias.",
  " Ficha completa en el calendario de Carreras Asturias.",
  " Calendario de carreras de Asturias.",
  " Ficha en Carreras Asturias.",
  " Carreras Asturias.",
  " Calendario.",
  " Ficha.",
];

/**
 * Meta description de la ficha (140-150 caracteres) con datos reales:
 * nombre, fecha, concejo/localidad, modalidad · disciplina y distancias si existen.
 */
export function eventDescription(event: Evento): string {
  const fecha = formatRangoFecha(event.fecha_inicio, event.fecha_fin);
  const anio = anioEvento(event);
  const cuando = anio && event.fecha_inicio ? `${fecha} de ${anio}` : fecha;
  const concejo = event.municipio ?? event.localidad ?? event.municipio_meta;
  const donde = concejo ? `en ${concejo} (Asturias)` : "en Asturias";
  const tipo = `${modalidadLabel(event)} · ${disciplineLabelForEvent(event)}`;
  const dist = distanciasTexto(event);

  const cuerpo = (nombre: string, conDist: boolean) =>
    `${nombre}: ${cuando}, ${donde}. ${tipo}${conDist && dist ? `. Distancias: ${dist}` : ""}.`;

  // 1) Nombre completo y distancias; si no cabe, sin distancias; si aún no, nombre recortado.
  const nombre = event.nombre.replace(/\s+/g, " ").trim();
  let base = cuerpo(nombre, true);
  if (base.length > DESCRIPCION_MAX - 10) base = cuerpo(nombre, false);
  if (base.length > DESCRIPCION_MAX - 10) {
    const sobra = base.length - (DESCRIPCION_MAX - 10);
    const corto = recortarTitulo(nombreCorto(nombre), Math.max(20, nombre.length - sobra));
    base = cuerpo(corto, false);
    if (base.length > DESCRIPCION_MAX) base = recortarTitulo(base, DESCRIPCION_MAX);
  }

  // 2) Rellena con coletillas (sin datos inventados) hasta quedar en 140-150.
  let out = base;
  for (const coletilla of COLETILLAS) {
    if (out.length >= DESCRIPCION_MIN) break;
    if (out.length + coletilla.length <= DESCRIPCION_MAX) out += coletilla;
  }
  return out;
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
  const fullTitle = absoluteTitle ? title : titleWithSite(title);
  return {
    title: { absolute: fullTitle },
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
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/**
 * Las fichas celebradas no llevan noindex. Siguen siendo páginas públicas.
 * El sitemap no las incluye (ver `incluirEnSitemap`).
 */
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
  const fullTitle = titleWithSite(event.nombre);

  return {
    title: { absolute: fullTitle },
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
      images: image ? [{ url: image }] : [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image ?? OG_IMAGE.url],
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
  if (estado === "proximamente" || estado === "cerrada_pendiente_apertura") {
    return `${SCHEMA}/PreOrder`;
  }

  const tags = tagSet(event);
  if (tags.has("inscripcion_abierta")) return `${SCHEMA}/InStock`;
  if (tags.has("inscripcion_cerrada")) return `${SCHEMA}/SoldOut`;
  return undefined;
}

export function eventOffersJsonLd(event: Evento): JsonLd | undefined {
  const url = trimmed(event.url_inscripcion) ?? trimmed(event.url_oficial);
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

/** Organizaciones (plan SEO parte A): AvilesIA + Carreras Asturias. */
export function organizationsJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://avilesia.es/#org",
        name: "AvilesIA",
        url: "https://avilesia.es/",
        logo: "https://avilesia.es/brand/avilesia-og.png",
        areaServed: "Asturias",
      },
      {
        "@type": "Organization",
        name: "Carreras Asturias",
        url: `${SITE_URL}/`,
        areaServed: "Asturias",
      },
    ],
  };
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

export type MigaDePan = { nombre: string; path: string };

/** BreadcrumbList con URL absolutas (www). */
export function breadcrumbJsonLd(migas: MigaDePan[]): JsonLd {
  return {
    "@context": SCHEMA,
    "@type": "BreadcrumbList",
    itemListElement: migas.map((miga, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: miga.nombre,
      item: absoluteUrl(miga.path),
    })),
  };
}

/** ItemList de fichas: nombre y URL absoluta de cada carrera, en el orden recibido. */
export function itemListEventosJsonLd(
  nombre: string,
  eventos: Pick<Evento, "id_canonico" | "nombre">[],
): JsonLd {
  return {
    "@context": SCHEMA,
    "@type": "ItemList",
    name: nombre,
    numberOfItems: eventos.length,
    itemListElement: eventos.map((evento, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: evento.nombre,
      url: absoluteUrl(eventPath(evento.id_canonico)),
    })),
  };
}
