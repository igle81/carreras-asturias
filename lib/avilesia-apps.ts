export const AVILESIA_APPS_URL = "https://avilesia.es/avilesia-apps.json";

const HOSTS_ESTA_APP = new Set([
  "www.carrerasasturias.es",
  "carrerasasturias.es",
  // Alias que redirige a www.carrerasasturias.es. carreras.avilesia.es es de Carreras España.
  "carrerasasturias.avilesia.es",
]);

export type AppAvilesia = {
  id: string;
  nombre: string;
  url: string;
  categoria: string;
  descripcion: string;
  hosts: string[];
};

type AppJson = {
  id?: unknown;
  nombre?: unknown;
  url?: unknown;
  hosts?: unknown;
  activo?: unknown;
  categoria?: unknown;
  descripcion?: unknown;
};

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function categoriaEs(value: unknown): string {
  if (value && typeof value === "object" && "es" in value) {
    return texto((value as { es?: unknown }).es);
  }
  return texto(value);
}

export function esEstaApp(app: { id: string; url: string; hosts: string[] }): boolean {
  if (app.id === "carreras") return true;
  let host = "";
  try {
    host = new URL(app.url).hostname;
  } catch {
    host = "";
  }
  return [host, ...app.hosts].some(
    (entrada) =>
      HOSTS_ESTA_APP.has(entrada) ||
      entrada === "carreras-asturias.vercel.app" ||
      entrada.startsWith("carreras-asturias-"),
  );
}

export function appsVisibles(lista: AppAvilesia[]): AppAvilesia[] {
  return lista.filter((app) => app.nombre && app.url && !esEstaApp(app));
}

export function parseAppsAvilesia(payload: unknown): AppAvilesia[] {
  const apps = payload && typeof payload === "object" ? (payload as { apps?: unknown }).apps : null;
  if (!Array.isArray(apps)) return [];
  const lista: AppAvilesia[] = [];
  for (const item of apps as AppJson[]) {
    if (!item || typeof item !== "object" || item.activo === false) continue;
    const hosts = Array.isArray(item.hosts) ? item.hosts.filter((host): host is string => typeof host === "string") : [];
    lista.push({
      id: texto(item.id),
      nombre: texto(item.nombre),
      url: texto(item.url),
      categoria: categoriaEs(item.categoria),
      descripcion: categoriaEs(item.descripcion),
      hosts,
    });
  }
  return appsVisibles(lista);
}

export async function leerAppsAvilesia(): Promise<AppAvilesia[]> {
  try {
    const response = await fetch(AVILESIA_APPS_URL, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    return parseAppsAvilesia(await response.json());
  } catch (error) {
    console.error("No se pudo leer avilesia-apps.json", error);
    return [];
  }
}

/** Dominios antiguos que redirigen: se enlaza directo al definitivo. */
const DOMINIO_FINAL: Record<string, string> = {
  "www.avilesia.es": "avilesia.es",
  "asturguia.avilesia.es": "audioguias.avilesia.es",
  "alquileres.avilesia.es": "pisos.avilesia.es",
};

/** URL limpia y definitiva: sin utm_ ni dominios que redirigen. */
export function urlLimpia(url: string): string {
  try {
    const destino = new URL(url);
    destino.hostname = DOMINIO_FINAL[destino.hostname] ?? destino.hostname;
    for (const clave of [...destino.searchParams.keys()]) {
      if (clave.toLowerCase().startsWith("utm_")) destino.searchParams.delete(clave);
    }
    return destino.toString();
  } catch {
    return url;
  }
}
