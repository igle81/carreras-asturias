import type { EstiloCategoria } from "@/components/mapa-banderillas/tipos";
import { disciplineLabel, disciplineMarkerColor } from "./disciplines";
import { isPortalExcluded } from "./portal-dedupe";
import { eventPath } from "./seo";
import type { Evento } from "./types";

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
  fecha?: string;
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

/** Las mismas que pintaba el mapa de círculos: con coordenadas válidas y sin duplicar. */
export function eventosParaMapa(events: Evento[]): Evento[] {
  return events.filter((event) => {
    if (isPortalExcluded(event)) return false;
    return coordenadasUtiles(event.lat, event.lng);
  });
}

export function lugarDelEvento(event: Evento): string | undefined {
  const sitio = event.municipio?.trim() || event.localidad?.trim() || "";
  if (esPrecisionMunicipio(event.coords_precision)) {
    return sitio ? `Ubicación aproximada · ${sitio}` : "Ubicación aproximada (municipio)";
  }
  return sitio || undefined;
}

export function puntosDesdeEventos(events: Evento[]): PuntoCarrera[] {
  return eventosParaMapa(events).map((event) => {
    const fecha = diaDe(event);
    return {
      nombre: event.nombre,
      lat: event.lat as number,
      lon: event.lng as number,
      categoria: event.disciplina_normalizada?.trim() || "sin-categoria",
      ...(fecha ? { fecha } : {}),
      enlace: eventPath(event.id_canonico),
      lugar: lugarDelEvento(event),
    };
  });
}

export function hayUbicacionDeMunicipio(events: Evento[]): boolean {
  return eventosParaMapa(events).some((event) => esPrecisionMunicipio(event.coords_precision));
}

export const TEXTO_UBICACION_APROXIMADA =
  "La ubicación es aproximada cuando solo consta el municipio: la banderilla marca el centro del concejo, no la línea de salida.";
