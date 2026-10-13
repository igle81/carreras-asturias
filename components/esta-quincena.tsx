"use client";

import { Fragment } from "react";
import { AnuncioInfeed } from "./anuncio-infeed";
import { EventCard } from "./event-card";
import { indiceAnuncioEntreTarjetas, slotAnuncioInfeed } from "@/lib/adsense";
import { useGeo } from "./geo-provider";
import { distanceToEvent, matchesConcejo } from "@/lib/geo";
import type { Evento } from "@/lib/types";

export function EstaQuincena({ events }: { events: Evento[] }) {
  const { coords, concejo } = useGeo();
  const filtered = concejo ? events.filter((event) => matchesConcejo(event, concejo)) : events;
  const adSlot = slotAnuncioInfeed({
    NEXT_PUBLIC_ADSENSE_SLOT: process.env.NEXT_PUBLIC_ADSENSE_SLOT,
  });
  const adAt = adSlot ? indiceAnuncioEntreTarjetas(filtered.length) : null;

  return (
    <section id="quincena" className="mx-auto max-w-6xl px-4">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">
          Los próximos 14 días
        </p>
        <h2 className="font-display text-2xl font-bold text-ink">Esta quincena</h2>
      </div>
      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, index) => (
            <Fragment key={event.id_canonico}>
              {adAt === index ? <AnuncioInfeed slot={adSlot} /> : null}
              <EventCard
                event={event}
                distanceKm={coords ? distanceToEvent(coords, event) : null}
              />
            </Fragment>
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-forest/20 bg-white px-4 py-10 text-center text-muted">
          No hay carreras en esta quincena {concejo ? `en ${concejo}` : "por ahora"}.
        </p>
      )}
    </section>
  );
}
