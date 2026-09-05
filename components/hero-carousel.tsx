"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatFechaHumana } from "@/lib/dates";
import { disciplineLabel, disciplineTone } from "@/lib/disciplines";
import { eventCta } from "@/lib/events";
import type { Evento } from "@/lib/types";

const INTERVAL_MS = 5500;

export function HeroCarousel({ slides }: { slides: Evento[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!slides.length) {
    return (
      <section className="relative overflow-hidden bg-forest px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-gold">A pie y ciclismo</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-black">
            El calendario de las montañas, el asfalto y la bici
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            Aún no hay dorsales en esta modalidad. Prueba Todas o entra al calendario.
          </p>
        </div>
      </section>
    );
  }

  const event = slides[index];
  const cta = eventCta(event);

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${disciplineTone(event.disciplina_normalizada)}`} />
      <div className="hero-mountains pointer-events-none absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/10" />

      <div className="relative mx-auto flex min-h-[34rem] max-w-6xl flex-col justify-end px-4 py-10 sm:min-h-[36rem] sm:py-14">
        <div className="max-w-2xl text-white">
          {event.recien_abierta ? (
            <p className="mb-3">
              <span className="inline-flex items-center rounded-full bg-fire px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
                🔥 ¡RECIÉN ABIERTA!
              </span>
            </p>
          ) : (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Próxima dorsal
            </p>
          )}
          <p className="text-sm font-medium text-white/80">
            {disciplineLabel(event.disciplina_normalizada)}
            {event.municipio ? ` · ${event.municipio}` : ""}
          </p>
          <h1 className="mt-2 font-display text-4xl font-black leading-tight sm:text-5xl">
            {event.nombre}
          </h1>
          <p className="mt-3 text-base text-white/85 sm:text-lg">
            {formatFechaHumana(event.fecha_inicio)}
            {event.localidad ? ` · ${event.localidad}` : ""}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {cta.external ? (
              <a
                href={cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-forest hover:bg-gold"
              >
                Inscribirme
              </a>
            ) : (
              <Link
                href={cta.href}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-forest hover:bg-gold"
              >
                {cta.label}
              </Link>
            )}
            <Link
              href="/calendario"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Ver calendario
            </Link>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id_canonico}
              type="button"
              aria-label={`Ver ${slide.nombre}`}
              onClick={() => setIndex(slideIndex)}
              className={`h-2 rounded-full transition-all ${
                slideIndex === index ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
