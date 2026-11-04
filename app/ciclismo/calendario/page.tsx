import { Suspense } from "react";
import { CalendarView } from "@/components/calendar-view";
import { CalendarioServidor } from "@/components/calendario-servidor";
import { aligerarEventos, getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Calendario de ciclismo en Asturias 2026: BTT y carretera",
  absoluteTitle: true,
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

export default async function CiclismoCalendarioPage() {
  const events = await getEventos();
  // Fallback pintado en el servidor: H1 y próximas pruebas en el HTML inicial (SEO 04-11-2026).
  return (
    <Suspense fallback={<CalendarioServidor events={events} section={SECTIONS.ciclismo} />}>
      <CalendarView events={aligerarEventos(events)} section={SECTIONS.ciclismo} />
    </Suspense>
  );
}
