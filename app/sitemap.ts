import type { MetadataRoute } from "next";
import { getEventos } from "@/lib/events";
import { absoluteUrl, eventPath, parseEventDate } from "@/lib/seo";

export const revalidate = 3600;

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const events = await getEventos();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
    url: absoluteUrl(eventPath(event.id_canonico)),
    lastModified: parseEventDate(event.fecha_inicio) ?? now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...eventEntries];
}
