import Link from "next/link";
import { ConfigurarCookies } from "./configurar-cookies";
import { LEGAL_NAV } from "@/lib/legal";
import { SECTIONS } from "@/lib/sections";

/** Enlaces fijos en HTML a la red AvilesIA (plan SEO parte A). */
const RED_AVILESIA = [
  { href: "https://avilesia.es/", label: "AvilesIA" },
  { href: "https://teletexto.avilesia.es/", label: "Teletexto IA" },
  { href: "https://ideas.avilesia.es/", label: "¿Tienes una idea?" },
  { href: "https://audioguias.avilesia.es/", label: "AudioGuías" },
  { href: "https://planes.avilesia.es/", label: "asturPlanIA" },
  { href: "https://pisos.avilesia.es/", label: "Pisos Avilés" },
  { href: "https://opos.avilesia.es/", label: "oposAsturIA" },
  { href: "https://chinches.avilesia.es/", label: "Mapeo Vecinal de Chinches Hediondas – Avilés y Comarca" },
  { href: "https://escolar.avilesia.es/", label: "Deporte Escolar Asturias" },
] as const;

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
          <Link href={SECTIONS.pie.home} className="inline-flex min-h-6 items-center hover:underline">
            Correr
          </Link>
          <Link href={SECTIONS.ciclismo.home} className="inline-flex min-h-6 items-center hover:underline">
            Ciclismo
          </Link>
          <Link href={SECTIONS.pie.calendar} className="inline-flex min-h-6 items-center hover:underline">
            Calendario a pie
          </Link>
          <Link href={SECTIONS.ciclismo.calendar} className="inline-flex min-h-6 items-center hover:underline">
            Calendario bici
          </Link>
        </div>
      </div>
      <nav
        aria-label="Información legal"
        className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 border-t border-white/15 px-4 py-4 text-sm font-medium text-white"
      >
        {LEGAL_NAV.map((item) => (
          <Link key={item.href} href={item.href} className="inline-flex min-h-6 items-center hover:underline">
            {item.label}
          </Link>
        ))}
        <ConfigurarCookies className="inline-flex min-h-6 items-center font-medium text-white underline-offset-2 hover:underline" />
      </nav>
      <nav
        aria-label="Otras apps de AvilesIA"
        className="mx-auto max-w-6xl border-t border-white/15 px-4 py-4 text-sm text-white"
      >
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {RED_AVILESIA.map((item, i) => (
            <span key={item.href} className="inline-flex items-center gap-x-2">
              {i > 0 ? <span aria-hidden="true">·</span> : null}
              <a href={item.href} className="inline-flex min-h-6 items-center hover:underline">
                {item.label}
              </a>
            </span>
          ))}
        </p>
      </nav>
    </footer>
  );
}
