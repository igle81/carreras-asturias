import { leerAppsAvilesia, urlLimpia } from "@/lib/avilesia-apps";

/**
 * Bloque «Parte de AvilesIA». La lista sale de avilesia-apps.json
 * y esta app no se incluye a sí misma.
 */
export async function AvilesiaApps({ className = "" }: { className?: string }) {
  const apps = await leerAppsAvilesia();
  const portal = urlLimpia("https://avilesia.es/");

  return (
    <section aria-labelledby="avilesia-apps-title" className={`mx-auto max-w-6xl px-4 ${className}`}>
      <div className="rounded-[2rem] bg-atlantic px-5 py-6 text-white shadow-xl sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Parte de AvilesIA</p>
            <h2 id="avilesia-apps-title" className="mt-1 font-display text-2xl font-black sm:text-3xl">
              Carreras Asturias es parte de AvilesIA
            </h2>
          </div>
          <a
            href={portal}
            target="_blank"
            rel="noopener"
            className="hidden shrink-0 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-white sm:inline-flex"
          >
            Ver AvilesIA →
          </a>
        </div>
        {apps.length ? (
          <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {apps.map((app) => (
              <li key={app.id || app.url}>
                <a
                  href={urlLimpia(app.url)}
                  target="_blank"
                  rel="noopener"
                  className="flex h-full flex-col rounded-2xl bg-white p-4 text-ink transition hover:-translate-y-0.5 hover:bg-gold"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-atlantic">
                    {app.categoria || "AvilesIA"}
                  </span>
                  <span className="mt-1 font-display text-lg font-black leading-tight">{app.nombre}</span>
                  {app.descripcion ? <span className="mt-1 text-sm text-muted">{app.descripcion}</span> : null}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-white">El resto de apps de AvilesIA está en avilesia.es.</p>
        )}
        <a
          href={portal}
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
