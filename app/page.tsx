import { HomeView } from "@/components/home-view";
import { getEventos } from "@/lib/events";

export default async function HomePage() {
  const events = await getEventos();
  return <HomeView events={events} />;
}
