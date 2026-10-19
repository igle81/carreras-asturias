import { AvilesiaApps } from "@/components/avilesia-apps";
import { JsonLd } from "@/components/json-ld";
import { Landing } from "@/components/landing";
import { getEventos } from "@/lib/events";
import { filterByModalidad } from "@/lib/modalidad";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, organizationsJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
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
      <JsonLd data={organizationsJsonLd()} />
      <Landing
        pieCount={filterByModalidad(events, "pie").length}
        biciCount={filterByModalidad(events, "ciclismo").length}
      />
      <AvilesiaApps className="py-10" />
    </>
  );
}
