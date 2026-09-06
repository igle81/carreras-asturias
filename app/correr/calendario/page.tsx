import { Suspense } from "react";
import { CalendarView } from "@/components/calendar-view";
import { getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Calendario de carreras a pie",
  description:
    "Calendario de trail, running y asfalto en Asturias. Filtra por inscripción, disciplina, concejo y fecha.",
  path: "/correr/calendario",
  keywords: [
    "calendario trail Asturias",
    "calendario running Asturias",
    "carreras a pie por fecha",
    "inscripciones trail Asturias",
  ],
});

function CalendarFallback() {
  return <div className="mx-auto max-w-6xl px-4 py-16 text-ink/50">Cargando el calendario…</div>;
}

export default async function CorrerCalendarioPage() {
  const events = await getEventos();
  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarView events={events} section={SECTIONS.pie} />
    </Suspense>
  );
}
