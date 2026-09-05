import type { Coords, Evento } from "./types";

const EARTH_KM = 6371;

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(from: Coords, to: Coords): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function eventCoords(event: Evento): Coords | null {
  if (event.lat == null || event.lng == null) return null;
  return { lat: event.lat, lng: event.lng };
}

export function distanceToEvent(from: Coords, event: Evento): number | null {
  const to = eventCoords(event);
  if (!to) return null;
  return haversineKm(from, to);
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`;
  if (km < 10) return `${km.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
}

export function uniqueConcejos(events: Evento[]): string[] {
  const values = new Set<string>();
  for (const event of events) {
    if (event.municipio?.trim()) values.add(event.municipio.trim());
  }
  return [...values].sort((a, b) => a.localeCompare(b, "es"));
}

export function matchesConcejo(event: Evento, concejo: string) {
  const needle = concejo.trim().toLocaleLowerCase("es");
  return [event.municipio, event.municipio_meta].some(
    (value) => value?.trim().toLocaleLowerCase("es") === needle,
  );
}

export const ASTURIAS_CENTER: Coords = { lat: 43.36, lng: -5.85 };
