"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConcejoSelect } from "./concejo-select";
import { GeoButton } from "./geo-button";
import { useGeo } from "./geo-provider";
import { SECTIONS, sectionFromPath } from "@/lib/sections";

export function SiteHeader({
  concejosPie,
  concejosBici,
}: {
  concejosPie: string[];
  concejosBici: string[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { showConcejoFallback } = useGeo();
  const section = sectionFromPath(pathname ?? "");
  const concejos = section?.id === "ciclismo" ? concejosBici : concejosPie;
  const calendarHref = section?.calendar ?? SECTIONS.pie.calendar;
  const mapHref = section ? `${section.home}#mapa` : "/correr#mapa";

  const nav = (
    <>
      <Link
        href={SECTIONS.pie.home}
        className={section?.id === "pie" ? "font-bold text-forest" : "hover:text-forest"}
      >
        Correr
      </Link>
      <Link
        href={SECTIONS.ciclismo.home}
        className={section?.id === "ciclismo" ? "font-bold text-forest" : "hover:text-forest"}
      >
        Ciclismo
      </Link>
      <Link href={calendarHref} className="hover:text-forest">
        Calendario
      </Link>
      {section ? (
        <Link href={mapHref} className="hover:text-forest">
          Mapa
        </Link>
      ) : null}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-fog/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-sm font-black text-gold">
            CA
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight text-forest">
              Carreras Asturias
            </span>
            <span className="hidden text-[11px] text-ink/55 sm:block">
              A pie o bici. Tú eliges el calendario.
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink/80 md:flex">{nav}</nav>

        <div className="hidden items-center gap-2 lg:flex">
          {section ? <GeoButton compact /> : null}
          {section && showConcejoFallback ? <ConcejoSelect concejos={concejos} className="max-w-48" /> : null}
        </div>

        <button
          type="button"
          className="rounded-full border border-forest/15 bg-white px-3 py-1.5 text-sm text-forest md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          Menú
        </button>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-forest/10 px-4 py-3 text-sm font-medium md:hidden">
          <div className="flex flex-col gap-3" onClick={() => setOpen(false)}>
            {nav}
          </div>
          {section ? (
            <>
              <GeoButton />
              <ConcejoSelect concejos={concejos} />
            </>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
