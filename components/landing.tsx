import Link from "next/link";
import { SECTIONS } from "@/lib/sections";

export function Landing({ pieCount, biciCount }: { pieCount: number; biciCount: number }) {
  return (
    <section className="relative overflow-hidden bg-forest text-white">
      <div className="hero-mountains pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
          A pie y ciclismo en Asturias
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-tight sm:text-6xl">
          Elige tu terreno. Dos calendarios, cero mezclas.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/75">
          Carreras a pie por un lado. Ciclismo por el otro. Cada uno con su
          hero, su mapa y sus dorsales recién abiertos.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href={SECTIONS.pie.home}
            className="group rounded-[2rem] bg-white p-6 text-forest shadow-xl transition hover:-translate-y-0.5 hover:bg-gold sm:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">A pie</p>
            <h2 className="mt-2 font-display text-3xl font-black">Carreras a pie</h2>
            <p className="mt-2 text-sm text-ink/70">
              Trail, asfalto y cross. {pieCount} pruebas en el calendario.
            </p>
            <span className="mt-6 inline-flex rounded-full bg-forest px-4 py-2 text-sm font-bold text-white group-hover:bg-pine">
              Entrar a correr
            </span>
          </Link>
          <Link
            href={SECTIONS.ciclismo.home}
            className="group rounded-[2rem] border border-white/20 bg-white/10 p-6 text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15 sm:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Bici</p>
            <h2 className="mt-2 font-display text-3xl font-black">Ciclismo</h2>
            <p className="mt-2 text-sm text-white/75">
              Carretera, BTT, enduro y cicloturismo. {biciCount} pruebas en el calendario.
            </p>
            <span className="mt-6 inline-flex rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink">
              Entrar a ciclismo
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
