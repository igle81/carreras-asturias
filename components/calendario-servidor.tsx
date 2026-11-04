import { formatRangoFecha } from "@/lib/dates";
import { upcomingEvents } from "@/lib/events";
import { filterByModalidad } from "@/lib/modalidad";
import { SECTIONS, type Section } from "@/lib/sections";
import { eventPath } from "@/lib/seo";
import type { Evento } from "@/lib/types";

const MAX_PROXIMAS = 60;

/**
 * Calendario pintado en el servidor (SEO 04-11-2026). Va como fallback del
 * Suspense de CalendarView: el HTML inicial lleva H1 y próximas pruebas en vez
 * de «Cargando el calendario…». Al hidratar lo sustituye la vista con filtros.
 */
export function CalendarioServidor({ events, section }: { events: Evento[]; section: Section }) {
  const proximas = upcomingEvents(filterByModalidad(events, section.id)).slice(0, MAX_PROXIMAS);
  const other = SECTIONS[section.other];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">{section.eyebrow}</p>
          <h1 className="font-display text-3xl font-black text-ink">{section.calendarTitle}</h1>
          <p className="mt-2 text-muted">{section.calendarLead}</p>
        </div>
        <a href={other.calendar} className="text-sm font-semibold text-atlantic">
          Calendario de {other.nav} →
        </a>
      </div>

      <h2 className="mb-3 font-display text-xl font-bold text-ink">Próximas pruebas</h2>
      {proximas.length === 0 ? (
        <p className="text-muted">No hay pruebas próximas publicadas.</p>
      ) : (
        <ul className="divide-y divide-forest/10 rounded-3xl border border-forest/10 bg-white">
          {proximas.map((event) => {
            const lugar = event.municipio ?? event.localidad ?? event.municipio_meta;
            return (
              <li key={event.id_canonico} className="px-4 py-3">
                <a href={eventPath(event.id_canonico)} className="font-semibold text-ink hover:text-atlantic">
                  {event.nombre}
                </a>
                <span className="block text-sm text-muted">
                  {formatRangoFecha(event.fecha_inicio, event.fecha_fin)}
                  {lugar ? ` · ${lugar}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
