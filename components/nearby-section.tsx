"use client";

import { useMemo, useState } from "react";
import { EventCard } from "./event-card";
import { EventMap } from "./event-map";
import { ConcejoSelect } from "./concejo-select";
import { GeoButton } from "./geo-button";
import { useGeo } from "./geo-provider";
import { daysUntil } from "@/lib/dates";
import { distanceToEvent, matchesConcejo, uniqueConcejos } from "@/lib/geo";
import type { Evento } from "@/lib/types";

export function NearbySection({ events, title }: { events: Evento[]; title?: string }) {
  const { coords, concejo, status, showConcejoFallback } = useGeo();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const concejos = uniqueConcejos(events);

  const listed = useMemo(() => {
    const withCoords = events.filter((event) => event.lat != null && event.lng != null);
    const scoped = concejo ? withCoords.filter((event) => matchesConcejo(event, concejo)) : withCoords;

    return [...scoped].sort((a, b) => {
      if (coords) {
        const da = distanceToEvent(coords, a);
        const db = distanceToEvent(coords, b);
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      }
      return (daysUntil(a.fecha_inicio) ?? 999) - (daysUntil(b.fecha_inicio) ?? 999);
    });
  }, [concejo, coords, events]);

  return (
    <section id="mapa" className="mx-auto max-w-6xl px-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Mapa</p>
          <h2 className="font-display text-2xl font-bold text-ink">
            {coords ? "Más cercanas a ti" : title ?? "Carreras por el Principado"}
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            {status === "granted"
              ? "Ordenadas por distancia desde tu posición."
              : showConcejoFallback
                ? "Sin ubicación. Filtra por concejo y sigue buscando dorsal."
                : "Activa la ubicación o elige concejo si prefieres no compartirla."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <GeoButton />
          <ConcejoSelect concejos={concejos} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <EventMap events={listed} userCoords={coords} selectedId={selectedId} />
        <div className="grid max-h-[32rem] gap-3 overflow-y-auto pr-1">
          {listed.map((event) => (
            <div
              key={event.id_canonico}
              className={`rounded-[1.6rem] ${
                selectedId === event.id_canonico ? "ring-2 ring-atlantic/50" : ""
              }`}
            >
              <EventCard
                event={event}
                distanceKm={coords ? distanceToEvent(coords, event) : null}
              />
              <button
                type="button"
                onClick={() => setSelectedId(event.id_canonico)}
                className="w-full px-4 pb-3 text-left text-xs font-semibold text-atlantic hover:text-forest"
              >
                Ver en el mapa
              </button>
            </div>
          ))}
          {!listed.length ? (
            <p className="rounded-3xl border border-dashed border-forest/20 bg-white px-4 py-10 text-center text-ink/60">
              No hay carreras con coordenadas {concejo ? `en ${concejo}` : "todavía"}.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
