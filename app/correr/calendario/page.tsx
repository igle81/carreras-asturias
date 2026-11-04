import { Suspense } from "react";
import { CalendarView } from "@/components/calendar-view";
import { CalendarioServidor } from "@/components/calendario-servidor";
import { aligerarEventos, getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Calendario de carreras a pie en Asturias 2026",
  absoluteTitle: true,
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

export default async function CorrerCalendarioPage() {
  const events = await getEventos();
  // Fallback pintado en el servidor: H1 y próximas pruebas en el HTML inicial (SEO 04-11-2026).
  return (
    <Suspense fallback={<CalendarioServidor events={events} section={SECTIONS.pie} />}>
      <CalendarView events={aligerarEventos(events)} section={SECTIONS.pie} />
    </Suspense>
  );
}
