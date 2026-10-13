"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivarAvisos } from "./activar-avisos";
import { ConcejoSelect } from "./concejo-select";
import { GeoButton } from "./geo-button";
import { useGeo } from "./geo-provider";
import { accionesCuentaVisible, RUTA_AVISOS, RUTA_REGISTRO } from "@/lib/registro-alertas";
import { cerrarSesion } from "@/lib/sesion-cuenta";
import { getSupabase } from "@/lib/supabase";
import { SECTIONS, sectionFromPath } from "@/lib/sections";

export function SiteHeader({
  concejosPie,
  concejosBici,
}: {
  concejosPie: string[];
  concejosBici: string[];
}) {
  const [open, setOpen] = useState(false);
  const [haySesion, setHaySesion] = useState(false);
  const pathname = usePathname();
  const { showConcejoFallback } = useGeo();
  const section = sectionFromPath(pathname ?? "");
  const concejos = section?.id === "ciclismo" ? concejosBici : concejosPie;
  const calendarHref = section?.calendar ?? SECTIONS.pie.calendar;
  const mapHref = section ? `${section.home}#mapa` : "/correr#mapa";

  useEffect(() => {
    const supabase = getSupabase();
    let cancelado = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelado) setHaySesion(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
      setHaySesion(Boolean(session));
    });
    return () => {
      cancelado = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const acciones = accionesCuentaVisible(haySesion);

  async function alSalir() {
    try {
      await cerrarSesion();
    } catch {
      setHaySesion(true);
    }
  }

  const cuenta = (
    <>
      {acciones.includes("registro") ? (
        <Link
          href={RUTA_REGISTRO}
          className="inline-flex items-center justify-center rounded-full border border-forest/15 bg-white px-3 py-1.5 text-xs font-semibold text-forest shadow-sm hover:border-atlantic/40"
        >
          Registro
        </Link>
      ) : null}
      {acciones.includes("avisos") ? (
        <Link
          href={RUTA_AVISOS}
          className="text-xs font-semibold text-forest underline-offset-2 hover:underline"
        >
          Mis avisos
        </Link>
      ) : null}
      {acciones.includes("salir") ? (
        <button
          type="button"
          onClick={() => void alSalir()}
          className="text-xs font-semibold text-forest underline-offset-2 hover:underline"
        >
          Salir
        </button>
      ) : null}
    </>
  );

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
    <header className="border-b border-forest/10 bg-fog/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-carreras-asturias.png"
            alt="Carreras Asturias"
            width={40}
            height={40}
            className="h-10 w-10"
          />
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
          className="rounded-full bg-forest px-3 py-1.5 text-sm font-semibold text-white md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          Menú
        </button>
      </div>

      <div className="border-t border-forest/10 px-4 py-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
          <ActivarAvisos />
          {cuenta}
        </div>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-forest/10 px-4 py-3 text-sm font-medium md:hidden">
          <div className="flex flex-col gap-3" onClick={() => setOpen(false)}>
            {nav}
            {acciones.includes("registro") ? <Link href={RUTA_REGISTRO}>Registro</Link> : null}
            {acciones.includes("avisos") ? (
              <Link href={RUTA_AVISOS} className="font-semibold text-forest">
                Mis avisos
              </Link>
            ) : null}
            {acciones.includes("salir") ? (
              <button type="button" onClick={() => void alSalir()} className="text-left">
                Salir
              </button>
            ) : null}
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
