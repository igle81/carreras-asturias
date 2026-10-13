import { Suspense } from "react";
import { AvilesiaApps } from "./avilesia-apps";
import { DecathlonAfiliado } from "./decathlon-afiliado";
import { AvilesiaEscapada } from "./avilesia-escapada";
import { DisciplineLinkChips } from "./discipline-chips";
import { EstaQuincena } from "./esta-quincena";
import { HeroCarousel } from "./hero-carousel";
import { HomeBanner } from "./home-banner";
import { NearbySection } from "./nearby-section";
import { RecienAbiertasStrip } from "./recien-abiertas-strip";
import { VipPromo } from "./vip-promo";
import { estaQuincena, listedEvents, pickHeroSlides, recienAbiertas, upcomingEvents } from "@/lib/events";
import { filterByModalidad } from "@/lib/modalidad";
import type { Section } from "@/lib/sections";
import { SECTIONS } from "@/lib/sections";
import type { Evento } from "@/lib/types";
import { getVipCheckoutUrl } from "@/lib/vip-checkout";
import { getVipCustomerPortalLoginUrl } from "@/lib/vip-paths";

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
            <p className="mt-1 text-sm text-muted">{section.blurb}</p>
          </div>
          <a href={other.home} className="text-sm font-semibold text-atlantic">
            Ir a {other.nav} →
          </a>
        </div>
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-semibold text-forest">Filtros</summary>
          <p className="mb-3 mt-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Elige disciplina
          </p>
          <Suspense fallback={null}>
            <DisciplineLinkChips events={scoped} calendarPath={section.calendar} modalidad={section.id} />
          </Suspense>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`${section.calendar}?cerradas=1`}
              className="rounded-full border border-forest/15 bg-white px-3.5 py-2 text-sm font-semibold text-forest hover:border-atlantic/40"
            >
              Cerradas
            </a>
            <a
              href={`${section.calendar}?clasificacion=1`}
              className="rounded-full border border-forest/15 bg-white px-3.5 py-2 text-sm font-semibold text-forest hover:border-atlantic/40"
            >
              Con clasificación
            </a>
          </div>
        </details>
      </div>
      <div className="space-y-14 pb-8">
        <RecienAbiertasStrip events={recien} calendarHref={`${section.calendar}?recien=1`} />
        <AvilesiaApps />
        <div className="mx-auto max-w-6xl px-4">
          <AvilesiaEscapada modalidad={section.id} comarca />
        </div>
        <EstaQuincena events={quincena} />
        {section.id === "pie" ? (
          <div className="mx-auto max-w-6xl px-4">
            <DecathlonAfiliado />
          </div>
        ) : null}
        <NearbySection events={listedEvents(scoped)} title={section.mapTitle} />
        <VipPromo
          checkoutUrl={getVipCheckoutUrl()}
          portalLoginUrl={getVipCustomerPortalLoginUrl()}
        />
      </div>
    </>
  );
}
