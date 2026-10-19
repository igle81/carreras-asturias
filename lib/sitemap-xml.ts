import { fetchEventos } from "@/lib/events";
import { isRaceFinished } from "@/lib/fin-estimado";
import { concejoPath, concejosDe, mesActualOSiguiente, mesesConPruebas, mesPath, numeroMes } from "@/lib/paginas-seo";
import { absoluteUrl, eventPath, parseEventDate } from "@/lib/seo";
import type { Evento } from "@/lib/types";

const EVENT_FETCH_TIMEOUT_MS = 5_000;
const MAX_EVENT_URLS = 10_000;
const EVENT_ID_RE = /^[A-Za-z0-9._~-]+$/;

type SitemapRow = {
  path: string;
  changeFrequency: "daily" | "weekly";
  priority: string;
  lastmod: string;
};

const STATIC_ROUTES: Omit<SitemapRow, "lastmod">[] = [
  { path: "/", changeFrequency: "daily", priority: "1.0" },
  { path: "/correr", changeFrequency: "daily", priority: "0.9" },
  { path: "/ciclismo", changeFrequency: "daily", priority: "0.9" },
  { path: "/correr/calendario", changeFrequency: "daily", priority: "0.8" },
  { path: "/ciclismo/calendario", changeFrequency: "daily", priority: "0.8" },
  { path: "/este-fin-de-semana", changeFrequency: "daily", priority: "0.8" },
  { path: "/trail", changeFrequency: "daily", priority: "0.7" },
  { path: "/concejo", changeFrequency: "weekly", priority: "0.6" },
  { path: "/calendario/meses", changeFrequency: "weekly", priority: "0.6" },
];

/** Páginas SEO que dependen de los datos: meses desde el actual y concejos con pruebas. */
export function seoRows(events: Evento[], today: string, now: Date): SitemapRow[] {
  const rows: SitemapRow[] = [];
  const actual = mesActualOSiguiente(events, now);
  const clave = (m: { anio: string; mes: string }) => `${m.anio}-${String(numeroMes(m.mes)).padStart(2, "0")}`;
  for (const m of mesesConPruebas(events)) {
    if (actual && clave(m) < clave(actual)) continue;
    rows.push({ path: mesPath(m), changeFrequency: "daily", priority: "0.7", lastmod: today });
  }
  for (const slug of concejosDe(events).keys()) {
    rows.push({ path: concejoPath(slug), changeFrequency: "weekly", priority: "0.5", lastmod: today });
  }
  return rows;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function lastmodDay(value: Date | undefined, fallback: Date): string {
  const date = value instanceof Date && Number.isFinite(value.getTime()) ? value : fallback;
  return date.toISOString().slice(0, 10);
}

function urlEntry(url: string, lastmod: string, changeFrequency: string, priority: string): string {
  return [
    "<url>",
    `<loc>${escapeXml(url)}</loc>`,
    `<lastmod>${escapeXml(lastmod)}</lastmod>`,
    `<changefreq>${escapeXml(changeFrequency)}</changefreq>`,
    `<priority>${escapeXml(priority)}</priority>`,
    "</url>",
  ].join("");
}

function staticRows(today: string): SitemapRow[] {
  return STATIC_ROUTES.map((route) => ({ ...route, lastmod: today }));
}

/**
 * Las fichas celebradas siguen accesibles e indexables (sin noindex).
 * No entran en el sitemap: el rastreo se queda con las que aún no han acabado.
 */
export function incluirEnSitemap(event: Evento, now: Date): boolean {
  return !isRaceFinished(event, now);
}

function eventRows(events: Evento[], today: string, now: Date): SitemapRow[] {
  const rows: SitemapRow[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    if (rows.length >= MAX_EVENT_URLS) break;
    const id = typeof event.id_canonico === "string" ? event.id_canonico.trim() : "";
    if (!id || !EVENT_ID_RE.test(id) || seen.has(id) || !incluirEnSitemap(event, now)) continue;

    let url: string;
    try {
      url = absoluteUrl(eventPath(id));
      new URL(url);
    } catch {
      continue;
    }

    seen.add(id);
    rows.push({
      path: eventPath(id),
      changeFrequency: "weekly",
      priority: "0.6",
      lastmod: lastmodDay(parseEventDate(event.fecha_inicio), now) || today,
    });
  }

  return rows;
}

function renderXml(rows: SitemapRow[]): string {
  const body = rows
    .map((row) => urlEntry(absoluteUrl(row.path), row.lastmod, row.changeFrequency, row.priority))
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function staticSitemapXml(now = new Date()): string {
  return renderXml(staticRows(lastmodDay(now, now)));
}

async function loadEventsForSitemap(): Promise<Evento[]> {
  try {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const events = await Promise.race([
      fetchEventos().catch((error) => {
        console.error("sitemap: no se pudieron cargar eventos", error);
        return [] as Evento[];
      }),
      new Promise<Evento[]>((resolve) => {
        timeout = setTimeout(() => {
          console.error("sitemap: timeout cargando eventos");
          resolve([]);
        }, EVENT_FETCH_TIMEOUT_MS);
      }),
    ]);
    if (timeout) clearTimeout(timeout);
    return Array.isArray(events) ? events : [];
  } catch (error) {
    console.error("sitemap: no se pudieron cargar eventos", error);
    return [];
  }
}

/** Always returns well-formed XML. Event failures fall back to static routes. */
export async function buildSitemapXml(): Promise<string> {
  const fallback = staticSitemapXml();
  try {
    const now = new Date();
    const today = lastmodDay(now, now);
    const events = await loadEventsForSitemap();
    return renderXml([...staticRows(today), ...seoRows(events, today, now), ...eventRows(events, today, now)]);
  } catch (error) {
    console.error("sitemap: generación falló; se sirven rutas estáticas", error);
    return fallback;
  }
}
