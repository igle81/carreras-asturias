"use client";

import { EventCard } from "./event-card";
import { useGeo } from "./geo-provider";
import { distanceToEvent } from "@/lib/geo";
import type { Evento } from "@/lib/types";

export function RecienAbiertasStrip({
  events,
  calendarHref = "/correr/calendario?recien=1",
}: {
  events: Evento[];
  calendarHref?: string;
}) {
  const { coords } = useGeo();

  if (!events.length) {
    return (
      <section id="recien" className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-fire">Dorsales calientes</p>
        <h2 className="font-display text-2xl font-bold text-ink">Recién abiertas</h2>
        <p className="mt-3 rounded-3xl border border-dashed border-forest/20 bg-white px-4 py-8 text-center text-ink/60">
          En esta modalidad no hay inscripciones recién abiertas ahora mismo.
        </p>
      </section>
    );
  }

  return (
    <section id="recien" className="mx-auto max-w-6xl px-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-fire">Dorsales calientes</p>
          <h2 className="font-display text-2xl font-bold text-ink">Recién abiertas</h2>
        </div>
        <a href={calendarHref} className="text-sm font-semibold text-atlantic">
          Ver todas
        </a>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x">
        {events.map((event) => (
          <div key={event.id_canonico} className="snap-start">
            <EventCard
              event={event}
              compact
              distanceKm={coords ? distanceToEvent(coords, event) : null}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
