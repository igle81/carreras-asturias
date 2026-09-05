import { HomeView } from "@/components/home-view";
import { getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";

export const metadata = {
  title: "Ciclismo",
  description: "Calendario de carretera, BTT, enduro y cicloturismo en Asturias. Inscripciones recién abiertas y mapa.",
};

export default async function CiclismoPage() {
  const events = await getEventos();
  return <HomeView events={events} section={SECTIONS.ciclismo} />;
}
