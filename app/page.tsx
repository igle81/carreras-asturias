import { Landing } from "@/components/landing";
import { getEventos } from "@/lib/events";
import { filterByModalidad } from "@/lib/modalidad";

export default async function HomePage() {
  const events = await getEventos();
  return (
    <Landing
      pieCount={filterByModalidad(events, "pie").length}
      biciCount={filterByModalidad(events, "ciclismo").length}
    />
  );
}
