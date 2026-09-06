import { HomeView } from "@/components/home-view";
import { getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Carreras a pie en Asturias",
  description:
    "Calendario de trail, asfalto, cross y running en Asturias. Inscripciones recién abiertas, mapa por concejo y dorsales a pie.",
  path: "/correr",
  keywords: [
    "carreras a pie Asturias",
    "trail Asturias",
    "running Asturias",
    "asfalto Asturias",
    "cross Asturias",
    "inscripciones trail",
  ],
});

export default async function CorrerPage() {
  const events = await getEventos();
  return <HomeView events={events} section={SECTIONS.pie} />;
}
