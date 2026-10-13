import Link from "next/link";
import { ConfigurarCookies } from "./configurar-cookies";
import { LEGAL_NAV } from "@/lib/legal";
import { SECTIONS } from "@/lib/sections";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-forest/10 bg-forest text-fog">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl font-bold">Carreras Asturias</p>
          <p className="mt-2 max-w-md text-sm text-fog">
            Dos calendarios: a pie y ciclismo. Inscripciones, concejos y la
            próxima dorsal que no se te puede escapar.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-medium text-white">
          <Link href={SECTIONS.pie.home} className="hover:underline">
            Correr
          </Link>
          <Link href={SECTIONS.ciclismo.home} className="hover:underline">
            Ciclismo
          </Link>
          <Link href={SECTIONS.pie.calendar} className="hover:underline">
            Calendario a pie
          </Link>
          <Link href={SECTIONS.ciclismo.calendar} className="hover:underline">
            Calendario bici
          </Link>
        </div>
      </div>
      <nav
        aria-label="Información legal"
        className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 border-t border-white/15 px-4 py-4 text-sm font-medium text-white"
      >
        {LEGAL_NAV.map((item) => (
          <Link key={item.href} href={item.href} className="hover:underline">
            {item.label}
          </Link>
        ))}
        <ConfigurarCookies className="font-medium text-white underline-offset-2 hover:underline" />
      </nav>
    </footer>
  );
}
