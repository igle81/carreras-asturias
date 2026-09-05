"use client";

import dynamic from "next/dynamic";
import type { Coords, Evento } from "@/lib/types";

const EventMapCanvas = dynamic(() => import("./event-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[22rem] place-items-center rounded-3xl bg-moss/30 text-sm text-ink/50">
      Cargando el mapa de Asturias…
    </div>
  ),
});

type EventMapProps = {
  events: Evento[];
  userCoords?: Coords | null;
  selectedId?: string | null;
};

export function EventMap({ events, userCoords, selectedId }: EventMapProps) {
  return (
    <div className="h-full min-h-[22rem] overflow-hidden rounded-3xl border border-forest/10">
      <EventMapCanvas events={events} userCoords={userCoords} selectedId={selectedId} />
    </div>
  );
}
