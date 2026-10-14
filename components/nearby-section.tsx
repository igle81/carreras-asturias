"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventCard } from "./event-card";
import { ConcejoSelect } from "./concejo-select";
import { GeoButton } from "./geo-button";
import { useGeo } from "./geo-provider";
import { daysUntil } from "@/lib/dates";
import { distanceToEvent, matchesConcejo, uniqueConcejos } from "@/lib/geo";
import type { Evento } from "@/lib/types";

const MapaCarreras = dynamic(
  () => import("./mapa-carreras").then((mod) => mod.MapaCarreras),
  { ssr: false, loading: () => <p className="text-sm text-muted">Cargando el mapa…</p> },
);

export function NearbySection({ events, title }: { events: Evento[]; title?: string }) {
  const { coords, concejo, status, showConcejoFallback } = useGeo();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verMapa, setVerMapa] = useState(false);
  const [visibles, setVisibles] = useState(12);
  // «Ver en el mapa»: abre el mapa (carga Leaflet sin esperar), baja a #mapa y la ficha se abre por `foco`.
  const [irAlMapa, setIrAlMapa] = useState(0);
  const seccion = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!irAlMapa) return;
    // Espera a que Leaflet esté montado (o 5 s como mucho) y entonces baja a #mapa.
    let intentos = 0;
    let t = 0;
    const bajar = () => {
      seccion.current?.scrollIntoView({ behavior: "auto", block: "start" });
      if (window.location.hash !== "#mapa") window.history.replaceState(null, "", "#mapa");
    };
    const comprobar = () => {
      const montado = seccion.current?.querySelector(".leaflet-container");
      if (montado || intentos++ > 50) {
        bajar();
        // Segundo ajuste por si el mapa o la ficha cambian la altura.
        t = window.setTimeout(bajar, 350);
        return;
      }
      t = window.setTimeout(comprobar, 100);
    };
    comprobar();
    return () => window.clearTimeout(t);
  }, [irAlMapa]);
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
    <section ref={seccion} id="mapa" className="mx-auto max-w-6xl px-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Mapa</p>
          <h2 className="font-display text-2xl font-bold text-ink">
            {coords ? "Más cercanas a ti" : title ?? "Carreras por el Principado"}
          </h2>
          <p className="mt-1 text-sm text-muted">
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

      {verMapa ? (
        <div className="mb-4">
          <MapaCarreras events={listed} selectedId={selectedId} alto="32rem" inmediato={irAlMapa > 0} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setVerMapa(true)}
          className="mb-4 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          Ver mapa
        </button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listed.slice(0, visibles).map((event) => (
          <div
            key={event.id_canonico}
            className={`rounded-[1.6rem] ${
              selectedId === event.id_canonico ? "ring-2 ring-atlantic/50" : ""
            }`}
          >
            <EventCard
              event={event}
              distanceKm={coords ? distanceToEvent(coords, event) : null}
              accion={
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(event.id_canonico);
                    setVerMapa(true);
                    setIrAlMapa((n) => n + 1);
                  }}
                  data-scroll-objetivo
                  className="inline-flex min-h-6 items-center rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#0b4f5c] ring-1 ring-[#0b4f5c]/25 hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
                  Ver en el mapa
                </button>
              }
            />

          </div>
        ))}
        {!listed.length ? (
          <p className="rounded-3xl border border-dashed border-forest/20 bg-white px-4 py-10 text-center text-muted sm:col-span-2 lg:col-span-3">
            No hay carreras con coordenadas {concejo ? `en ${concejo}` : "todavía"}.
          </p>
        ) : null}
      </div>
      {listed.length > visibles ? (
        <button
          type="button"
          onClick={() => setVisibles((actual) => actual + 20)}
          className="mt-4 rounded-full border border-forest/20 bg-white px-4 py-2 text-sm font-semibold text-forest"
        >
          Ver más
        </button>
      ) : null}
    </section>
  );
}
