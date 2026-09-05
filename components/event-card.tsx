import Link from "next/link";
import { daysUntil, formatFechaHumana } from "@/lib/dates";
import { disciplineLabel } from "@/lib/disciplines";
import { eventCta, formatDistancias } from "@/lib/events";
import { formatKm } from "@/lib/geo";
import type { Evento } from "@/lib/types";

type EventCardProps = {
  event: Evento;
  distanceKm?: number | null;
  compact?: boolean;
};

function RecienBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-fire px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
      🔥 ¡RECIÉN ABIERTA!
    </span>
  );
}

export function EventCard({ event, distanceKm, compact = false }: EventCardProps) {
  const cta = eventCta(event);
  const distances = formatDistancias(event);
  const days = daysUntil(event.fecha_inicio);
  const thisWeek = days !== null && days >= 0 && days <= 7;
  const closed = event.estado_inscripcion === "cerrada";

  return (
    <article
      className={`flex h-full flex-col rounded-3xl border border-forest/10 bg-white shadow-[0_10px_30px_-18px_rgba(11,61,46,0.45)] ${
        compact ? "min-w-[260px] max-w-[280px]" : ""
      }`}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {event.recien_abierta ? <RecienBadge /> : null}
          {thisWeek ? (
            <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-forest">
              Esta semana
            </span>
          ) : null}
          {closed ? (
            <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink/70">
              Inscripción cerrada
            </span>
          ) : null}
          {distanceKm != null ? (
            <span className="rounded-full bg-atlantic/10 px-2.5 py-1 text-[11px] font-bold text-atlantic">
              {formatKm(distanceKm)}
            </span>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-atlantic">
            {disciplineLabel(event.disciplina_normalizada)}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink">
            <Link href={`/evento/${event.id_canonico}`} className="hover:text-forest">
              {event.nombre}
            </Link>
          </h3>
        </div>

        <p className="text-sm text-ink/70">
          {formatFechaHumana(event.fecha_inicio)}
          {event.municipio ? ` · ${event.municipio}` : ""}
        </p>
        {event.localidad ? (
          <p className="text-xs text-ink/50">{event.localidad}</p>
        ) : null}
        {distances ? <p className="text-sm font-medium text-forest">{distances}</p> : null}
      </div>

      <div className="flex items-center gap-2 border-t border-forest/8 px-4 py-3">
        {cta.external ? (
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-pine"
          >
            {cta.label}
          </a>
        ) : (
          <Link
            href={cta.href}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-forest/20 px-3 py-2 text-sm font-semibold text-forest hover:bg-moss/40"
          >
            {cta.label}
          </Link>
        )}
        <Link
          href={`/evento/${event.id_canonico}`}
          className="rounded-full px-3 py-2 text-sm text-ink/60 hover:text-forest"
        >
          Ficha
        </Link>
      </div>
    </article>
  );
}

