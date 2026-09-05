import { DisciplineLinkChips } from "./discipline-chips";
import { EstaQuincena } from "./esta-quincena";
import { HeroCarousel } from "./hero-carousel";
import { HomeBanner } from "./home-banner";
import { NearbySection } from "./nearby-section";
import { RecienAbiertasStrip } from "./recien-abiertas-strip";
import { VipPromo } from "./vip-promo";
import { estaQuincena, pickHeroSlides, recienAbiertas, upcomingEvents } from "@/lib/events";
import type { Evento } from "@/lib/types";

export function HomeView({ events }: { events: Evento[] }) {
  const hero = pickHeroSlides(events);
  const recien = recienAbiertas(upcomingEvents(events));
  const quincena = estaQuincena(events);

  return (
    <>
      <HeroCarousel slides={hero} />
      <HomeBanner count={recien.length} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
          Elige disciplina
        </p>
        <DisciplineLinkChips />
      </div>
      <div className="space-y-14 pb-8">
        <RecienAbiertasStrip events={recien} />
        <EstaQuincena events={quincena} />
        <NearbySection events={upcomingEvents(events)} />
        <VipPromo />
      </div>
    </>
  );
}
