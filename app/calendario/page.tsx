import { Suspense } from "react";
import { CalendarView } from "@/components/calendar-view";
import { getEventos } from "@/lib/events";

export const metadata = {
  title: "Calendario",
  description: "Filtra carreras a pie y ciclismo en Asturias por modalidad, inscripción, disciplina, concejo y fecha.",
};

function CalendarFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-ink/50">
      Cargando el calendario…
    </div>
  );
}

export default async function CalendarioPage() {
  const events = await getEventos();

  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarView events={events} />
    </Suspense>
  );
}
