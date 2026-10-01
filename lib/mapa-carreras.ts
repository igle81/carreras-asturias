import type { EstiloCategoria } from "@/components/mapa-banderillas/tipos";
import { daysUntilMadrid } from "./dates";
import { disciplineLabel, disciplineMarkerColor } from "./disciplines";
import { isPortalExcluded } from "./portal-dedupe";
import { eventPath } from "./seo";
import type { Evento } from "./types";

/** Carreras de los últimos días siguen en el mapa; lo más antiguo, no. */
export const DIAS_RECIENTES_MAPA = 7;

const ICONOS: Record<string, string> = {
  asfalto: "🏃",
  trail: "⛰️",
  mixto: "🌲",
  media_maraton: "🏅",
  nocturna: "🌙",
  skyrace: "🏔️",
  marcha: "🚶",
  cross: "🏃",
  carretera: "🚴",
  ciclista_carretera: "🚴",
  mtb: "🚵",
  btt: "🚵",
  gravel: "🚴",
  cicloturismo: "🚴",
  criterium: "🚴",
  ciclismo: "🚴",
  ciclismo_otro: "🚴",
  enduro: "🚵",
  ciclocross: "🚴",
};

export type PuntoCarrera = {
  nombre: string;
  lat: number;
  lon: number;
  categoria: string;
  fecha: string;
  enlace: string;
  lugar?: string;
};

export function categoriasBanderillas(): Record<string, EstiloCategoria> {
  return Object.fromEntries(
    Object.keys(ICONOS).map((clave) => [
      clave,
      {
        nombre: disciplineLabel(clave),
        color: disciplineMarkerColor(clave),
        icono: ICONOS[clave],
      },
    ]),
  );
}

export function esPrecisionMunicipio(precision: string | null | undefined): boolean {
  return (precision ?? "").trim().toLocaleLowerCase("es") === "aprox_municipio";
}

export function coordenadasUtiles(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function diaDe(event: Evento): string | null {
  const raw = event.fecha_inicio?.trim();
  if (!raw) return null;
  return raw.slice(0, 10);
}

/** Pruebas que pueden pintarse: sin duplicar, con sitio y con fecha reciente o futura. */
export function eventosParaMapa(events: Evento[], from = new Date()): Evento[] {
  return events.filter((event) => {
    if (isPortalExcluded(event)) return false;
    if (!coordenadasUtiles(event.lat, event.lng)) return false;
    const delta = daysUntilMadrid(diaDe(event), from);
    return delta !== null && delta >= -DIAS_RECIENTES_MAPA;
  });
}

export function lugarDelEvento(event: Evento): string | undefined {
  const sitio = event.municipio?.trim() || event.localidad?.trim() || "";
  if (esPrecisionMunicipio(event.coords_precision)) {
    return sitio ? `Ubicación aproximada · ${sitio}` : "Ubicación aproximada (municipio)";
  }
  return sitio || undefined;
}

export function puntosDesdeEventos(events: Evento[], from = new Date()): PuntoCarrera[] {
  return eventosParaMapa(events, from).map((event) => ({
    nombre: event.nombre,
    lat: event.lat as number,
    lon: event.lng as number,
    categoria: event.disciplina_normalizada?.trim() || "sin-categoria",
    fecha: diaDe(event) as string,
    enlace: eventPath(event.id_canonico),
    lugar: lugarDelEvento(event),
  }));
}

export function hayUbicacionDeMunicipio(events: Evento[], from = new Date()): boolean {
  return eventosParaMapa(events, from).some((event) => esPrecisionMunicipio(event.coords_precision));
}

export function leyendaDe(puntos: PuntoCarrera[]): Array<Required<EstiloCategoria> & { clave: string }> {
  const categorias = categoriasBanderillas();
  const claves = [...new Set(puntos.map((punto) => punto.categoria))];
  return claves.map((clave) => {
    const estilo = categorias[clave];
    return {
      clave,
      nombre: estilo?.nombre || disciplineLabel(clave),
      color: estilo?.color || disciplineMarkerColor(clave),
      icono: estilo?.icono || "📍",
    };
  });
}
