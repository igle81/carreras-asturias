"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { hasAperturaReciente } from "@/lib/apertura-badge";
import { disciplineLabel, disciplineMarkerColor } from "@/lib/disciplines";
import { ASTURIAS_CENTER } from "@/lib/geo";
import { formatFechaCorta } from "@/lib/dates";
import type { Coords, Evento } from "@/lib/types";
import "leaflet/dist/leaflet.css";

type EventMapCanvasProps = {
  events: Evento[];
  userCoords?: Coords | null;
  selectedId?: string | null;
};

function FitEvents({
  events,
  userCoords,
  selectedId,
}: {
  events: Evento[];
  userCoords?: Coords | null;
  selectedId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    const selected = events.find((event) => event.id_canonico === selectedId);
    if (selected?.lat != null && selected.lng != null) {
      map.flyTo([selected.lat, selected.lng], 11, { duration: 0.6 });
      return;
    }

    const points = events
      .filter((event) => event.lat != null && event.lng != null)
      .map((event) => [event.lat as number, event.lng as number] as [number, number]);

    if (userCoords) points.push([userCoords.lat, userCoords.lng]);
    if (!points.length) {
      map.setView([ASTURIAS_CENTER.lat, ASTURIAS_CENTER.lng], 8);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 10);
      return;
    }
    map.fitBounds(points, { padding: [28, 28], maxZoom: 11 });
  }, [events, map, selectedId, userCoords]);

  return null;
}

export default function EventMapCanvas({ events, userCoords, selectedId }: EventMapCanvasProps) {
  return (
    <MapContainer
      center={[ASTURIAS_CENTER.lat, ASTURIAS_CENTER.lng]}
      zoom={8}
      className="h-full w-full"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitEvents events={events} userCoords={userCoords} selectedId={selectedId} />
      {userCoords ? (
        <CircleMarker
          center={[userCoords.lat, userCoords.lng]}
          radius={9}
          pathOptions={{ color: "#0284c7", fillColor: "#38bdf8", fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>Estás aquí</Popup>
        </CircleMarker>
      ) : null}
      {events.map((event) =>
        event.lat == null || event.lng == null ? null : (
          <CircleMarker
            key={event.id_canonico}
            center={[event.lat, event.lng]}
            radius={event.id_canonico === selectedId ? 11 : 8}
            pathOptions={{
              color: hasAperturaReciente(event) ? "#FF3B30" : disciplineMarkerColor(event.disciplina_normalizada),
              fillColor: hasAperturaReciente(event) ? "#FF3B30" : disciplineMarkerColor(event.disciplina_normalizada),
              fillOpacity: 0.88,
              weight: event.id_canonico === selectedId ? 3 : 1,
            }}
          >
            <Popup>
              <div className="min-w-40">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {disciplineLabel(event.disciplina_normalizada)}
                </p>
                <p className="font-semibold leading-snug">{event.nombre}</p>
                <p className="text-xs text-slate-600">
                  {formatFechaCorta(event.fecha_inicio)}
                  {event.municipio ? ` · ${event.municipio}` : ""}
                </p>
                <a className="mt-1 inline-block text-sm font-semibold text-emerald-800" href={`/evento/${event.id_canonico}`}>
                  Ver ficha
                </a>
              </div>
            </Popup>
          </CircleMarker>
        ),
      )}
    </MapContainer>
  );
}
