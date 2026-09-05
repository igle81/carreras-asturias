import { Suspense } from "react";
import { CalendarView } from "@/components/calendar-view";
import { getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";

export const metadata = {
  title: "Calendario a pie",
  description: "Filtra carreras a pie en Asturias por inscripción, disciplina, concejo y fecha.",
};

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
