/**
 * Javier 2026-10-06: referencia clara y visible a AvilesIA y sus apps.
 * Marca escrita «AvilesIA», sin ® ni texto de registro.
 * URLs sacadas de https://www.avilesia.es (no inventar subdominios).
 */
const UTM = "utm_source=carrerasasturias.es&utm_medium=bloque_avilesia";

const APPS = [
  {
    name: "asturGuÍA",
    what: "Guía turística",
    blurb: "Paseos con mapa y audio",
    href: `https://asturguia.avilesia.es/?${UTM}&utm_campaign=asturguia`,
  },
  {
    name: "asturPlanIA",
    what: "Planes",
    blurb: "Qué hacer en Asturias",
    href: `https://asturplania.avilesia.es/?${UTM}&utm_campaign=asturplania`,
  },
  {
    name: "AsturRentIA",
    what: "Alquileres",
    blurb: "Vivienda en Avilés",
    href: `https://alquileres.avilesia.es/?${UTM}&utm_campaign=alquileres`,
  },
  {
    name: "oposAsturIA",
    what: "Oposiciones",
    blurb: "Busca tu oposición",
    href: `https://opos.avilesia.es/?${UTM}&utm_campaign=oposasturia`,
  },
] as const;

const AVILESIA_URL = `https://www.avilesia.es/?${UTM}&utm_campaign=carreras`;

export function AvilesiaApps({ className = "" }: { className?: string }) {
  return (
    <section aria-labelledby="avilesia-apps-title" className={`mx-auto max-w-6xl px-4 ${className}`}>
      <div className="rounded-[2rem] bg-atlantic px-5 py-6 text-white shadow-xl sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-moss">
              Más apps de Asturias
            </p>
            <h2 id="avilesia-apps-title" className="mt-1 font-display text-2xl font-black sm:text-3xl">
              Carreras Asturias es parte de AvilesIA
            </h2>
          </div>
          <a
            href={AVILESIA_URL}
            target="_blank"
            rel="noopener"
            className="hidden shrink-0 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-white sm:inline-flex"
          >
            Ver AvilesIA →
          </a>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {APPS.map((app) => (
            <li key={app.name}>
              <a
                href={app.href}
                target="_blank"
                rel="noopener"
                className="flex h-full flex-col rounded-2xl bg-white p-4 text-ink transition hover:-translate-y-0.5 hover:bg-gold"
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-atlantic">
                  {app.what}
                </span>
                <span className="mt-1 font-display text-lg font-black leading-tight">{app.name}</span>
                <span className="mt-1 text-sm text-ink/70">{app.blurb}</span>
              </a>
            </li>
          ))}
        </ul>
        <a
          href={AVILESIA_URL}
          target="_blank"
          rel="noopener"
          className="mt-5 flex w-full justify-center rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink sm:hidden"
        >
          Ver AvilesIA →
        </a>
      </div>
    </section>
  );
}
