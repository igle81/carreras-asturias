import Link from "next/link";

export function HomeBanner({ count }: { count: number }) {
  const headline =
    count === 0
      ? "Hoy no hay inscripciones recién abiertas, pero el calendario sigue caliente."
      : count === 1
        ? "Hay 1 inscripción recién abierta. Si la quieres, el dorsal no espera."
        : `Hay ${count} inscripciones recién abiertas. Ponte las zapatillas antes de que vuelen.`;

  return (
    <section className="border-y border-gold/30 bg-gold/15">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg font-bold text-forest">{headline}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/calendario?recien=1"
            className="rounded-full bg-fire px-4 py-2 text-sm font-bold text-white"
          >
            Ver recién abiertas
          </Link>
          <Link
            href="/calendario?ventana=14"
            className="rounded-full border border-forest/20 bg-white px-4 py-2 text-sm font-semibold text-forest"
          >
            Próximos 14 días
          </Link>
        </div>
      </div>
    </section>
  );
}
