import type { MetadataRoute } from "next";
import { fetchEventos } from "@/lib/events";
import { absoluteUrl, eventPath, parseEventDate } from "@/lib/seo";
import type { Evento } from "@/lib/types";

export const revalidate = 3600;

const EVENT_FETCH_TIMEOUT_MS = 5_000;
const MAX_EVENT_URLS = 10_000;
const EVENT_ID_RE = /^[A-Za-z0-9._~-]+$/;

const STATIC_ROUTES: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/correr", changeFrequency: "daily", priority: 0.9 },
  { path: "/ciclismo", changeFrequency: "daily", priority: 0.9 },
  { path: "/correr/calendario", changeFrequency: "daily", priority: 0.8 },
  { path: "/ciclismo/calendario", changeFrequency: "daily", priority: 0.8 },
];

function sitemapDate(value: Date | undefined, fallback: Date): string {
  const date = value instanceof Date && Number.isFinite(value.getTime()) ? value : fallback;
  return date.toISOString();
}

function staticEntries(now: Date): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: sitemapDate(now, now),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

function eventEntries(events: Evento[], now: Date): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  for (const event of events) {
    if (entries.length >= MAX_EVENT_URLS) break;
    const id = typeof event.id_canonico === "string" ? event.id_canonico.trim() : "";
    if (!id || !EVENT_ID_RE.test(id) || seen.has(id)) continue;

    let url: string;
    try {
      url = absoluteUrl(eventPath(id));
      new URL(url);
    } catch {
      continue;
    }

    seen.add(id);
    entries.push({
      url,
      lastModified: sitemapDate(parseEventDate(event.fecha_inicio), now),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = staticEntries(now);

  try {
    const events = await loadEventsForSitemap();
    return [...staticRoutes, ...eventEntries(events, now)];
  } catch (error) {
    console.error("sitemap: generación de eventos falló; se sirven rutas estáticas", error);
    return staticRoutes;
  }
}
