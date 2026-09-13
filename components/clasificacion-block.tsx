import { clasificacionUrl, clasificacionVista } from "@/lib/clasificacion";
import type { Evento } from "@/lib/types";

const COPY = {
  proxima: {
    status: "Se publica al acabar",
    body: "Cuando termine la prueba la buscamos en cronometradores, web oficial y federación. Si no está, repetimos cada 2 horas.",
  },
  pendiente: {
    status: "Aún no publicada",
    body: "La carrera ya se corrió. Seguimos buscando la clasificación cada 2 horas.",
  },
  publicada: {
    status: "Publicada",
    body: "Resultados oficiales del cronometrador o de la organización.",
  },
} as const;

export function ClasificacionBlock({ event }: { event: Evento }) {
  const vista = clasificacionVista(event);
  const url = clasificacionUrl(event);
  const copy = COPY[vista];

  return (
    <section
      id="clasificacion"
      className="mt-8 overflow-hidden rounded-[2rem] border border-forest/10 bg-white px-6 py-6 sm:px-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">
        Clasificación
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl font-black text-ink">Resultados</h2>
        <span
          className={
            vista === "publicada"
              ? "rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink"
              : "rounded-full bg-ink/8 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink/70"
          }
        >
          {copy.status}
        </span>
      </div>
      <p className="mt-2 max-w-xl text-sm text-ink/65">{copy.body}</p>
      {vista === "publicada" && url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink"
        >
          Ver clasificación
        </a>
      ) : null}
    </section>
  );
}
