"use client";

import { useEffect, useRef, useState } from "react";
import { AVILESIA_GUIA_URL, AVILESIA_PLANES_URL, AVILESIA_URL } from "@/lib/avilesia";

const STORAGE_KEY = "ca_avilesia_barra_cerrada";
const LINKS = [
  { icon: "🎧", label: "Guía Avilés", href: AVILESIA_GUIA_URL },
  { icon: "📅", label: "Planes & Eventos", href: AVILESIA_PLANES_URL },
  { icon: "🚀", label: "Ecosistema", href: AVILESIA_URL },
] as const;

/**
 * Barra flotante inferior de AvilesIA (Javier 2026-10-06). Se esconde al bajar,
 * vuelve al subir y se cierra para la sesión con ✕ (sessionStorage).
 * Mientras está activa, `html[data-avilesia-barra]` reserva hueco abajo (globals.css).
 */
export function AvilesiaBarra() {
  const [activa, setActiva] = useState(false);
  const [oculta, setOculta] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let cerrada = false;
    try {
      cerrada = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {}
    if (!cerrada) setActiva(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!activa) {
      delete root.dataset.avilesiaBarra;
      return;
    }
    root.dataset.avilesiaBarra = "on";
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < 8) return;
      setOculta(delta > 0 && y > 80);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      delete root.dataset.avilesiaBarra;
    };
  }, [activa]);

  if (!activa) return null;

  function cerrar() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setActiva(false);
  }

  return (
    <nav
      aria-label="Apps de AvilesIA"
      className={`fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 transition-transform duration-300 ${
        oculta ? "translate-y-[calc(100%+1rem)]" : "translate-y-0"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div
        className="flex items-center gap-1 rounded-full border border-white/15 bg-ink/75 py-1.5 pl-4 pr-1.5 text-white shadow-xl shadow-ink/30 sm:gap-2"
        style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
      >
        <a
          href={AVILESIA_URL}
          target="_blank"
          rel="noopener"
          className="mr-1 font-display text-sm font-black tracking-tight text-gold sm:mr-2"
        >
          AvilesIA
        </a>
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener"
            aria-label={link.label}
            title={link.label}
            className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-semibold hover:bg-white/10"
          >
            <span aria-hidden className="text-base">
              {link.icon}
            </span>
            <span className="hidden sm:inline">{link.label}</span>
          </a>
        ))}
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar la barra de AvilesIA"
          className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>
    </nav>
  );
}
