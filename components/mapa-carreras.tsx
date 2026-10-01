"use client";

import { useMemo } from "react";
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

  return (
    <div className="h-full">
      {hayUbicacionDeMunicipio(events) ? (
        <p className="mb-2 text-xs leading-snug text-ink/60">{TEXTO_UBICACION_APROXIMADA}</p>
      ) : null}
      <MapaBanderillas
        puntos={puntos}
        categorias={categoriasBanderillas()}
        estiloPorDefecto={{ nombre: "Carrera", color: "#14532d", icono: "📍" }}
        comoLlegar
        alto={alto}
        foco={foco}
        textos={TEXTOS}
      />
    </div>
  );
}
