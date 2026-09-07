import { Suspense } from "react";
import { DisciplineLinkChips } from "./discipline-chips";
import { EstaQuincena } from "./esta-quincena";
import { HeroCarousel } from "./hero-carousel";
import { HomeBanner } from "./home-banner";
import { NearbySection } from "./nearby-section";
import { RecienAbiertasStrip } from "./recien-abiertas-strip";
import { VipPromo } from "./vip-promo";
import { estaQuincena, pickHeroSlides, recienAbiertas, upcomingEvents } from "@/lib/events";
import { filterByModalidad } from "@/lib/modalidad";
import type { Section } from "@/lib/sections";
import { SECTIONS } from "@/lib/sections";
import type { Evento } from "@/lib/types";
import { getVipCheckoutUrl } from "@/lib/vip-checkout";

export function HomeView({ events, section }: { events: Evento[]; section: Section }) {
  const scoped = filterByModalidad(events, section.id);
  const hero = pickHeroSlides(scoped);
  const recien = recienAbiertas(upcomingEvents(scoped));
  const quincena = estaQuincena(scoped);
  const other = SECTIONS[section.other];

  return (
    <>
      <HeroCarousel slides={hero} calendarHref={section.calendar} kicker={section.heroKicker} />
      <HomeBanner count={recien.length} section={section} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">{section.eyebrow}</p>
            <h2 className="font-display text-2xl font-bold text-ink">{section.title}</h2>
            <p className="mt-1 text-sm text-ink/60">{section.blurb}</p>
          </div>
          <a href={other.home} className="text-sm font-semibold text-atlantic">
            Ir a {other.nav} →
          </a>
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
          Elige disciplina
        </p>
        <Suspense fallback={null}>
          <DisciplineLinkChips events={scoped} calendarPath={section.calendar} modalidad={section.id} />
        </Suspense>
      </div>
      <div className="space-y-14 pb-8">
        <RecienAbiertasStrip events={recien} calendarHref={`${section.calendar}?recien=1`} />
        <EstaQuincena events={quincena} />
        <NearbySection events={upcomingEvents(scoped)} title={section.mapTitle} />
        <VipPromo checkoutUrl={getVipCheckoutUrl()} />
      </div>
    </>
  );
}
