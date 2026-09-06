import { Suspense } from "react";
import { CalendarView } from "@/components/calendar-view";
import { getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Calendario de ciclismo",
  description:
    "Calendario de MTB, BTT, carretera, enduro y cicloturismo en Asturias. Filtra por inscripción, disciplina, concejo y fecha.",
  path: "/ciclismo/calendario",
  keywords: [
    "calendario ciclismo Asturias",
    "calendario MTB Asturias",
    "BTT Asturias fechas",
    "inscripciones ciclismo Asturias",
  ],
});

function CalendarFallback() {
  return <div className="mx-auto max-w-6xl px-4 py-16 text-ink/50">Cargando el calendario…</div>;
}

export default async function CiclismoCalendarioPage() {
  const events = await getEventos();
  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarView events={events} section={SECTIONS.ciclismo} />
    </Suspense>
  );
}
