import { HomeView } from "@/components/home-view";
import { getEventos } from "@/lib/events";
import { parseModalidadFilter } from "@/lib/modalidad";

type HomePageProps = {
  searchParams: Promise<{ modalidad?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const events = await getEventos();
  const params = await searchParams;
  return <HomeView events={events} modalidad={parseModalidadFilter(params.modalidad)} />;
}
