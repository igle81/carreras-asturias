import { HomeView } from "@/components/home-view";
import { getEventos } from "@/lib/events";
import { SECTIONS } from "@/lib/sections";
import { JsonLd } from "@/components/json-ld";
import { CORRER_DESCRIPTION, organizationsJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Carreras a pie en Asturias",
  description: CORRER_DESCRIPTION,
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
  return (
    <>
      <JsonLd data={organizationsJsonLd()} />
      <HomeView events={events} section={SECTIONS.pie} />
    </>
  );
}
