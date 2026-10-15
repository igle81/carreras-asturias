import Link from "next/link";
import { ConfigurarCookies } from "./configurar-cookies";
import { LEGAL_NAV } from "@/lib/legal";
import { SECTIONS } from "@/lib/sections";
import { leerAppsAvilesia } from "@/lib/avilesia-apps";

/**
 * Enlaces a la red AvilesIA en el HTML del servidor (SEO). La lista sale de
 * avilesia-apps.json al construir/revalidar (sin esta app); si falla, esta lista fija.
 */
const RED_AVILESIA_RESPALDO = [
  { url: "https://teletexto.avilesia.es/", nombre: "Teletexto IA" },
  { url: "https://ideas.avilesia.es/", nombre: "¿Tienes una idea?" },
  { url: "https://audioguias.avilesia.es/", nombre: "AudioGuías" },
  { url: "https://planes.avilesia.es/", nombre: "asturPlanIA" },
  { url: "https://pisos.avilesia.es/", nombre: "Pisos Avilés" },
  { url: "https://opos.avilesia.es/", nombre: "oposAsturIA" },
  { url: "https://chinches.avilesia.es/", nombre: "Mapeo Vecinal de Chinches Hediondas – Avilés y Comarca" },
  { url: "https://escolar.avilesia.es/", nombre: "Deporte Escolar Asturias" },
] as const;

async function redAvilesia(): Promise<Array<{ url: string; nombre: string }>> {
  try {
    const apps = await leerAppsAvilesia();
    if (apps.length) return apps.map((app) => ({ url: app.url, nombre: app.nombre }));
  } catch {
    /* respaldo */
  }
  return [...RED_AVILESIA_RESPALDO];
}

export async function SiteFooter() {
  const red = await redAvilesia();
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
      <p className="mx-auto max-w-6xl border-t border-white/15 px-4 py-3 text-xs leading-6 text-fog">
        <a href="https://avilesia.es/" className="font-semibold text-white hover:underline">
          AvilesIA
        </a>
        {red.map((app) => (
          <span key={app.url}>
            {" · "}
            <a href={app.url} className="hover:underline">
              {app.nombre}
            </a>
          </span>
        ))}
      </p>
    </footer>
  );
}
