import { Suspense } from "react";
import { CalendarView } from "@/components/calendar-view";
import { getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";

export const metadata = {
  title: "Calendario de ciclismo",
  description: "Filtra pruebas de ciclismo en Asturias por inscripción, disciplina, concejo y fecha.",
};

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
