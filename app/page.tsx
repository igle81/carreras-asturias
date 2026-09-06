import { JsonLd } from "@/components/json-ld";
import { Landing } from "@/components/landing";
import { getEventos } from "@/lib/events";
import { filterByModalidad } from "@/lib/modalidad";
import { DEFAULT_TITLE, pageMetadata, websiteJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description:
    "Elige tu terreno: carreras a pie o ciclismo en Asturias. Trail, asfalto, MTB, BTT, carretera y dorsales recién abiertos, sin mezclar calendarios.",
  path: "/",
  absoluteTitle: true,
  keywords: [
    "carreras Asturias",
    "calendario trail Asturias",
    "running Asturias",
    "ciclismo Asturias",
    "MTB Asturias",
  ],
});

export default async function HomePage() {
  const events = await getEventos();
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <Landing
        pieCount={filterByModalidad(events, "pie").length}
        biciCount={filterByModalidad(events, "ciclismo").length}
      />
    </>
  );
}
