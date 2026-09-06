import { HomeView } from "@/components/home-view";
import { getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Ciclismo en Asturias",
  description:
    "Calendario de carretera, MTB, BTT, enduro, gravel y cicloturismo en Asturias. Inscripciones recién abiertas y mapa por concejo.",
  path: "/ciclismo",
  keywords: [
    "ciclismo Asturias",
    "MTB Asturias",
    "BTT Asturias",
    "enduro Asturias",
    "cicloturismo Asturias",
    "gravel Asturias",
  ],
});

export default async function CiclismoPage() {
  const events = await getEventos();
  return <HomeView events={events} section={SECTIONS.ciclismo} />;
}
