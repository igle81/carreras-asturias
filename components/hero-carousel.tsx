"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AperturaBadge } from "./apertura-badge";
import { resolveAperturaBadge } from "@/lib/apertura-badge";
import { formatFechaHumana } from "@/lib/dates";
import { disciplineLabelForEvent, disciplineTone } from "@/lib/disciplines";
import { EventPoster, useBrokenPoster } from "./event-poster";
import { eventCta, eventPosterUrl } from "@/lib/events";
import { modalidadLabel } from "@/lib/modalidad";
import type { Evento } from "@/lib/types";

const INTERVAL_MS = 5500;
const SWIPE_THRESHOLD = 48;

export function HeroCarousel({
  slides,
  calendarHref = "/correr/calendario",
  kicker = "A pie y ciclismo en Asturias",
}: {
  slides: Evento[];
  calendarHref?: string;
  kicker?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const interactPause = useRef(0);
  const drag = useRef({
    active: false,
    startX: 0,
    dragged: false,
  });
  const slideKey = slides.map((slide) => slide.id_canonico).join("|");
  const current = slides[index];
  const poster = current ? eventPosterUrl(current) : null;
  const backdrop = useBrokenPoster(poster);

  const go = useCallback(
    (direction: -1 | 1) => {
      if (slides.length <= 1) return;
      setIndex((current) => (current + direction + slides.length) % slides.length);
    },
    [slides.length],
  );

  const prev = useCallback(() => go(-1), [go]);
  const next = useCallback(() => go(1), [go]);

  function holdPause() {
    interactPause.current += 1;
    setPaused(true);
  }

  function releasePause() {
    interactPause.current = Math.max(0, interactPause.current - 1);
    if (interactPause.current === 0) setPaused(false);
  }

  useEffect(() => {
    setIndex(0);
  }, [slideKey]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  function pointerFromControl(target: EventTarget | null) {
    return Boolean((target as HTMLElement | null)?.closest("a, button"));
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (pointerFromControl(event.target)) return;
    drag.current = { active: true, startX: event.clientX, dragged: false };
    holdPause();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!drag.current.active) return;
    if (Math.abs(event.clientX - drag.current.startX) > 8) {
      drag.current.dragged = true;
    }
  }

  function endDrag(event: React.PointerEvent<HTMLElement>) {
    if (!drag.current.active) return;
    const delta = event.clientX - drag.current.startX;
    const didDrag = drag.current.dragged;
    drag.current.active = false;
    releasePause();
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta < 0) next();
      else prev();
    }
    if (didDrag) {
      window.setTimeout(() => {
        drag.current.dragged = false;
      }, 0);
    }
  }

  function onClickCapture(event: React.MouseEvent<HTMLElement>) {
    if (!drag.current.dragged) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  }

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
  const showPoster = Boolean(poster) && backdrop.show;

  return (
    <section
      className="relative touch-pan-y overflow-hidden select-none"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Carreras destacadas a pie y ciclismo"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      {showPoster && poster ? (
        <EventPoster
          src={poster}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
          onError={backdrop.onError}
        />
      ) : null}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${disciplineTone(event.disciplina_normalizada)} ${
          showPoster ? "opacity-45" : ""
        }`}
      />
      {showPoster ? null : <div className="hero-mountains pointer-events-none absolute inset-0 opacity-40" />}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${
          showPoster ? "from-black/70 via-black/35 to-black/20" : "from-black/55 via-black/15 to-black/10"
        }`}
      />

      <HeroArrow
        label="Carrera anterior"
        onClick={prev}
        onHold={holdPause}
        onRelease={releasePause}
        className="absolute top-1/2 left-4 z-20 hidden h-12 w-12 -translate-y-1/2 bg-white/90 text-forest shadow-md ring-1 ring-black/5 hover:bg-white sm:grid sm:h-14 sm:w-14"
      >
        ‹
      </HeroArrow>
      <HeroArrow
        label="Carrera siguiente"
        onClick={next}
        onHold={holdPause}
        onRelease={releasePause}
        className="absolute top-1/2 right-4 z-20 hidden h-12 w-12 -translate-y-1/2 bg-white/90 text-forest shadow-md ring-1 ring-black/5 hover:bg-white sm:grid sm:h-14 sm:w-14"
      >
        ›
      </HeroArrow>

      <div className="relative mx-auto flex min-h-[34rem] max-w-6xl cursor-grab flex-col justify-end px-4 py-10 active:cursor-grabbing sm:min-h-[36rem] sm:px-20 sm:py-14">
        <div className="max-w-2xl text-white">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {kicker}
          </p>
          {resolveAperturaBadge(event) ? (
            <p className="mb-3">
              <AperturaBadge event={event} size="hero" />
            </p>
          ) : null}
          <p className="text-sm font-medium text-white/80">
            {modalidadLabel(event)} · {disciplineLabelForEvent(event)}
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
              href={calendarHref}
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Ver calendario
            </Link>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 sm:justify-start">
          <HeroArrow
            label="Carrera anterior"
            onClick={prev}
            onHold={holdPause}
            onRelease={releasePause}
            className="grid h-9 w-9 shrink-0 bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/25 hover:bg-white/25 sm:hidden"
          >
            ‹
          </HeroArrow>
          <div className="flex flex-1 items-center justify-center gap-2 sm:flex-none sm:justify-start">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id_canonico}
                type="button"
                aria-label={`Ver ${slide.nombre}`}
                aria-current={slideIndex === index ? "true" : undefined}
                onClick={() => setIndex(slideIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  slideIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/40"
                }`}
              />
            ))}
          </div>
          <HeroArrow
            label="Carrera siguiente"
            onClick={next}
            onHold={holdPause}
            onRelease={releasePause}
            className="grid h-9 w-9 shrink-0 bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/25 hover:bg-white/25 sm:hidden"
          >
            ›
          </HeroArrow>
        </div>
      </div>
    </section>
  );
}

function HeroArrow({
  label,
  onClick,
  onHold,
  onRelease,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  onHold: () => void;
  onRelease: () => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={onHold}
      onMouseLeave={onRelease}
      onFocus={onHold}
      onBlur={onRelease}
      className={`place-items-center rounded-full text-2xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
