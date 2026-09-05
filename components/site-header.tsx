"use client";

import Link from "next/link";
import { useState } from "react";
import { ConcejoSelect } from "./concejo-select";
import { GeoButton } from "./geo-button";
import { useGeo } from "./geo-provider";

export function SiteHeader({ concejos }: { concejos: string[] }) {
  const [open, setOpen] = useState(false);
  const { showConcejoFallback } = useGeo();

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
              Trail, asfalto y dorsales del Principado
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink/80 md:flex">
          <Link href="/calendario" className="hover:text-forest">
            Calendario
          </Link>
          <Link href="/#mapa" className="hover:text-forest">
            Mapa
          </Link>
          <Link href="/#vip" className="hover:text-forest">
            Canal VIP
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <GeoButton compact />
          {showConcejoFallback ? <ConcejoSelect concejos={concejos} className="max-w-48" /> : null}
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
        <div className="space-y-3 border-t border-forest/10 px-4 py-3 md:hidden">
          <Link href="/calendario" className="block text-sm font-medium" onClick={() => setOpen(false)}>
            Calendario
          </Link>
          <Link href="/#mapa" className="block text-sm font-medium" onClick={() => setOpen(false)}>
            Mapa
          </Link>
          <Link href="/#vip" className="block text-sm font-medium" onClick={() => setOpen(false)}>
            Canal VIP
          </Link>
          <GeoButton />
          <ConcejoSelect concejos={concejos} />
        </div>
      ) : null}
    </header>
  );
}
