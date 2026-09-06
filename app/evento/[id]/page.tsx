import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AperturaBadge } from "@/components/apertura-badge";
import { EventMap } from "@/components/event-map";
import { JsonLd } from "@/components/json-ld";
import { daysUntil, formatRangoFecha } from "@/lib/dates";
import { disciplineLabelForEvent } from "@/lib/disciplines";
import { eventCta, formatDistancias, getEvento, getEventos } from "@/lib/events";
import { modalidadLabel, resolveModalidad } from "@/lib/modalidad";
import { calendarPath } from "@/lib/sections";
import { eventMetadata, sportsEventJsonLd } from "@/lib/seo";

type EventPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const events = await getEventos();
  return events.map((event) => ({ id: event.id_canonico }));
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvento(id);
  if (!event) {
    return { title: "Carrera", robots: { index: false, follow: false } };
  }
  return eventMetadata(event);
}

export default async function EventoPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEvento(id);
  if (!event) notFound();

  const cta = eventCta(event);
  const distances = formatDistancias(event);
  const days = daysUntil(event.fecha_inicio);
  const thisWeek = days !== null && days >= 0 && days <= 7;

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <JsonLd data={sportsEventJsonLd(event)} />
      <Link
        href={calendarPath(resolveModalidad(event))}
        className="text-sm font-semibold text-atlantic"
      >
        ← Volver al calendario
      </Link>

      <div className="mt-4 flex flex-wrap gap-2">
        <AperturaBadge event={event} size="hero" />
        {thisWeek ? (
          <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase text-forest">
            Esta semana
          </span>
        ) : null}
        {event.estado_inscripcion === "cerrada" ? (
          <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold uppercase text-ink/70">
            Inscripción cerrada
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-atlantic">
        {modalidadLabel(event)} · {disciplineLabelForEvent(event)}
      </p>
      <h1 className="mt-1 font-display text-4xl font-black text-ink">{event.nombre}</h1>
      <p className="mt-3 text-lg text-ink/70">
        {formatRangoFecha(event.fecha_inicio, event.fecha_fin)}
        {event.municipio ? ` · ${event.municipio}` : ""}
      </p>
      {event.localidad ? <p className="text-ink/55">{event.localidad}</p> : null}
      {distances ? <p className="mt-2 font-medium text-forest">{distances}</p> : null}
      {event.organizador ? (
        <p className="mt-2 text-sm text-ink/55">Organiza: {event.organizador}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {cta.external ? (
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-forest px-5 py-3 text-sm font-bold text-white hover:bg-pine"
          >
            {cta.label}
          </a>
        ) : event.url_oficial ? (
          <a
            href={event.url_oficial}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-forest px-5 py-3 text-sm font-bold text-white hover:bg-pine"
          >
            Web oficial
          </a>
        ) : null}
        <Link
          href={calendarPath(resolveModalidad(event))}
          className="rounded-full border border-forest/20 px-5 py-3 text-sm font-semibold text-forest"
        >
          Ver calendario
        </Link>
      </div>

      <div className="mt-8 h-80">
        <EventMap events={[event]} />
      </div>
    </article>
  );
}
