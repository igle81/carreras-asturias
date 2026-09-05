import { Suspense } from "react";
import { DisciplineLinkChips } from "./discipline-chips";
import { EstaQuincena } from "./esta-quincena";
import { HeroCarousel } from "./hero-carousel";
import { HomeBanner } from "./home-banner";
import { ModalityTabs } from "./modality-tabs";
import { NearbySection } from "./nearby-section";
import { RecienAbiertasStrip } from "./recien-abiertas-strip";
import { VipPromo } from "./vip-promo";
import { estaQuincena, pickHeroSlides, recienAbiertas, upcomingEvents } from "@/lib/events";
import { filterByModalidad, type ModalidadFilter } from "@/lib/modalidad";
import type { Evento } from "@/lib/types";

export function HomeView({
  events,
  modalidad,
}: {
  events: Evento[];
  modalidad: ModalidadFilter;
}) {
  const scoped = filterByModalidad(events, modalidad);
  const hero = pickHeroSlides(scoped);
  const recien = recienAbiertas(upcomingEvents(scoped));
  const quincena = estaQuincena(scoped);

  return (
    <>
      <HeroCarousel slides={hero} />
      <HomeBanner count={recien.length} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
          Modalidad
        </p>
        <Suspense fallback={null}>
          <ModalityTabs selected={modalidad} basePath="/" />
        </Suspense>
        <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
          Elige disciplina
        </p>
        <Suspense fallback={null}>
          <DisciplineLinkChips events={events} />
        </Suspense>
      </div>
      <div className="space-y-14 pb-8">
        <RecienAbiertasStrip events={recien} />
        <EstaQuincena events={quincena} />
        <NearbySection events={upcomingEvents(scoped)} />
        <VipPromo />
      </div>
    </>
  );
}
