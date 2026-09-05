"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DisciplineChips } from "./discipline-chips";
import { EventCard } from "./event-card";
import { EventMap } from "./event-map";
import { GeoButton } from "./geo-button";
import { useGeo } from "./geo-provider";
import { daysUntil, isWithinDays } from "@/lib/dates";
import { distanceToEvent, matchesConcejo, uniqueConcejos } from "@/lib/geo";
import type { Evento } from "@/lib/types";

export function CalendarView({ events }: { events: Evento[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { coords, status } = useGeo();
  const concejos = uniqueConcejos(events);

  const recien = searchParams.get("recien") === "1";
  const ventana = searchParams.get("ventana") === "14";
  const disciplina = searchParams.get("disciplina") ?? "";
  const concejo = searchParams.get("concejo") ?? "";
  const sort = searchParams.get("sort") === "distancia" ? "distancia" : "fecha";

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const filtered = useMemo(() => {
    const rows = events.filter((event) => {
      if (recien && !event.recien_abierta) return false;
      if (ventana && !isWithinDays(event.fecha_inicio, 14)) return false;
      if (disciplina && event.disciplina_normalizada !== disciplina) return false;
      if (concejo && !matchesConcejo(event, concejo)) return false;
      return true;
    });

    return [...rows].sort((a, b) => {
      if (sort === "distancia" && coords) {
        const da = distanceToEvent(coords, a);
        const db = distanceToEvent(coords, b);
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      }
      return (daysUntil(a.fecha_inicio) ?? 9999) - (daysUntil(b.fecha_inicio) ?? 9999);
    });
  }, [concejo, coords, disciplina, events, recien, sort, ventana]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Calendario</p>
        <h1 className="font-display text-3xl font-black text-ink">Todas las carreras</h1>
        <p className="mt-2 text-ink/65">
          Filtra por inscripción recién abierta, quincena, disciplina o concejo.
        </p>
      </div>

      <div className="mb-6 space-y-4 rounded-3xl border border-forest/10 bg-white p-4">
        <DisciplineChips />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update({ recien: recien ? null : "1" })}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold ${
              recien ? "bg-fire text-white" : "border border-forest/15 text-forest"
            }`}
          >
            Recién abiertas
          </button>
          <button
            type="button"
            onClick={() => update({ ventana: ventana ? null : "14" })}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold ${
              ventana ? "bg-forest text-white" : "border border-forest/15 text-forest"
            }`}
          >
            Ventana 14 días
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-ink/70">
            Concejo
            <select
              value={concejo}
              onChange={(event) => update({ concejo: event.target.value || null })}
              className="mt-1 w-full rounded-full border border-forest/15 bg-fog px-3 py-2 text-sm text-ink"
            >
              <option value="">Todos</option>
              {concejos.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-ink/70">
            Orden
            <select
              value={sort}
              onChange={(event) => update({ sort: event.target.value })}
              className="mt-1 w-full rounded-full border border-forest/15 bg-fog px-3 py-2 text-sm text-ink"
            >
              <option value="fecha">Por fecha</option>
              <option value="distancia" disabled={status !== "granted"}>
                Por distancia {status !== "granted" ? "(activa ubicación)" : ""}
              </option>
            </select>
          </label>
          <div className="flex items-end">
            <GeoButton />
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-ink/55">
        {filtered.length} {filtered.length === 1 ? "carrera" : "carreras"}
      </p>

      <div className="mb-8 hidden h-80 lg:block">
        <EventMap events={filtered} userCoords={coords} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((event) => (
          <EventCard
            key={event.id_canonico}
            event={event}
            distanceKm={coords ? distanceToEvent(coords, event) : null}
          />
        ))}
      </div>
      {!filtered.length ? (
        <p className="rounded-3xl border border-dashed border-forest/20 bg-white px-4 py-12 text-center text-ink/60">
          Ninguna carrera encaja con esos filtros. Prueba a soltar alguno.
        </p>
      ) : null}
    </div>
  );
}
