import { AVILESIA_GUIA_URL, AVILESIA_PLANES_URL, AVILESIA_URL, escapadaTitulo } from "@/lib/avilesia";
import type { ModalidadId } from "@/lib/modalidad";

/** Tarjeta «Prepara tu fin de semana» con la guía y los planes de AvilesIA. */
export function AvilesiaEscapada({
  modalidad,
  comarca,
  className = "",
}: {
  modalidad: ModalidadId;
  comarca: boolean;
  className?: string;
}) {
  const emoji = modalidad === "ciclismo" ? "🚴" : "🏃‍♂️";
  const texto = comarca
    ? "Descubre la hostelería, audioguías del casco histórico y la agenda de eventos local."
    : "Audioguías a pie, dónde comer y la agenda de planes cerca de la carrera.";

  return (
    <aside
      aria-label="Prepara tu visita con AvilesIA"
      className={`rounded-[1.75rem] border border-forest/10 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Prepara tu visita</p>
      <h2 className="mt-1 font-display text-xl font-black text-ink sm:text-2xl">
        <span aria-hidden>{emoji} </span>
        {escapadaTitulo(modalidad, comarca)}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">{texto}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={AVILESIA_GUIA_URL}
          target="_blank"
          rel="noopener"
          className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-pine"
        >
          🎧 Guía y audioguías
        </a>
        <a
          href={AVILESIA_PLANES_URL}
          target="_blank"
          rel="noopener"
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-ink hover:bg-gold/80"
        >
          📅 Planes y eventos
        </a>
        <a
          href={AVILESIA_URL}
          target="_blank"
          rel="noopener"
          className="text-sm font-semibold text-atlantic underline decoration-2 underline-offset-2"
        >
          Ver AvilesIA
        </a>
      </div>
    </aside>
  );
}
