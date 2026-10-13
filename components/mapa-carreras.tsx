"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapaBanderillas } from "@/components/mapa-banderillas";
import {
  categoriasBanderillas,
  hayUbicacionDeMunicipio,
  puntosDesdeEventos,
  TEXTO_UBICACION_APROXIMADA,
} from "@/lib/mapa-carreras";
import type { Evento } from "@/lib/types";

const TEXTOS = {
  enlace: "Ver ficha",
  etiquetaMapa: "Mapa de carreras en Asturias. Cada banderilla es un lugar con una o varias pruebas.",
};

export function MapaCarreras({
  events,
  selectedId,
  alto = "22rem",
}: {
  events: Evento[];
  selectedId?: string | null;
  alto?: string;
}) {
  const puntos = useMemo(() => puntosDesdeEventos(events), [events]);
  const seleccionado = events.find((event) => event.id_canonico === selectedId);
  const foco =
    seleccionado && seleccionado.lat != null && seleccionado.lng != null
      ? { lat: seleccionado.lat, lon: seleccionado.lng }
      : undefined;
  const marco = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = marco.current;
    if (!nodo || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(nodo);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-full" ref={marco} style={{ minHeight: alto }}>
      {hayUbicacionDeMunicipio(events) ? (
        <p className="mb-2 text-xs leading-snug text-muted">{TEXTO_UBICACION_APROXIMADA}</p>
      ) : null}
      {visible ? (
        <MapaBanderillas
          puntos={puntos}
          categorias={categoriasBanderillas()}
          estiloPorDefecto={{ nombre: "Carrera", color: "#14532d", icono: "📍" }}
          comoLlegar
          alto={alto}
          foco={foco}
          textos={TEXTOS}
        />
      ) : null}
    </div>
  );
}
