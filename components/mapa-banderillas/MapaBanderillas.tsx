"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { crearMapa } from "./nucleo";
import type { ControlMapa, OpcionesMapa } from "./tipos";

export type PropiedadesMapa = OpcionesMapa & {
  /** Lista de puntos: { nombre, lat, lon, categoria, fecha }. Lo no válido se ignora. */
  puntos: unknown;
  /** Alto del mapa en cualquier medida CSS (por defecto «32rem»). */
  alto?: string;
  className?: string;
};

/**
 * Mapa de banderillas. Solo se ejecuta en el navegador: Leaflet se carga con `import()` dentro de un efecto,
 * así que sirve tal cual en Next.js (componente de cliente) sin tocar `window` en el servidor.
 */
export function MapaBanderillas({ puntos, alto = "32rem", className, ...opciones }: PropiedadesMapa) {
  const contenedor = useRef<HTMLDivElement>(null);
  const control = useRef<ControlMapa | null>(null);
  const ultimas = useRef({ puntos, opciones });
  // Se guarda lo último recibido (en un efecto, no al pintar) para que los efectos de abajo lo lean sin repetirse.
  useEffect(() => {
    ultimas.current = { puntos, opciones };
  });

  // El mapa se crea una vez…
  useEffect(() => {
    let vivo = true;
    const el = contenedor.current;
    if (!el) return;
    crearMapa(el, ultimas.current.puntos, ultimas.current.opciones).then((c) => {
      if (!vivo) c.destruir();
      else control.current = c;
    });
    return () => {
      vivo = false;
      control.current?.destruir();
      control.current = null;
    };
  }, []);

  // …y se repinta cuando cambian los puntos o las opciones (se compara su contenido, no la identidad).
  const huella = JSON.stringify([puntos, { ...opciones, alAbrirBanderilla: undefined }]);
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    void control.current?.actualizar(ultimas.current.puntos, ultimas.current.opciones);
  }, [huella]);

  return <div ref={contenedor} className={className} style={{ height: alto }} />;
}

export default MapaBanderillas;
