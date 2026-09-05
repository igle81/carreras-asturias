import { HomeView } from "@/components/home-view";
import { getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";

export const metadata = {
  title: "Carreras a pie",
  description: "Calendario de trail, asfalto y dorsales a pie en Asturias. Inscripciones recién abiertas y mapa.",
};

export default async function CorrerPage() {
  const events = await getEventos();
  return <HomeView events={events} section={SECTIONS.pie} />;
}
