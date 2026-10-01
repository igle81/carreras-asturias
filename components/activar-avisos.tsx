"use client";

import { useEffect, useId, useState } from "react";
import {
  AVISOS_EVENTO,
  activarAvisos,
  avisosActivadosLocalmente,
  mensajeErrorAvisos,
} from "@/lib/onesignal-web";

type Estado = "inactivo" | "activando" | "activo" | "error";

const TEXTO_AVISOS =
  "Avisos de aperturas y clasificaciones. Puedes desactivarlos cuando quieras.";

export function ActivarAvisos({
  apariencia = "barra",
}: {
  apariencia?: "barra" | "ficha";
}) {
  const [estado, setEstado] = useState<Estado>("inactivo");
  const [mensaje, setMensaje] = useState("");
  const descripcionId = useId();

  useEffect(() => {
    function sincronizar() {
      setEstado((actual) => {
        if (actual === "activando") return actual;
        if (avisosActivadosLocalmente()) return "activo";
        return actual === "error" ? actual : "inactivo";
      });
    }

    sincronizar();
    window.addEventListener(AVISOS_EVENTO, sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(AVISOS_EVENTO, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  async function alPulsar() {
    if (estado === "activando" || estado === "activo") return;
    setEstado("activando");
    setMensaje("");
    try {
      await activarAvisos();
      setEstado("activo");
    } catch (error) {
      console.error(error);
      setEstado("error");
      setMensaje(mensajeErrorAvisos(error));
    }
  }

  const activo = estado === "activo";
  const enFicha = apariencia === "ficha";

  return (
    <div
      className={
        enFicha
          ? "mt-4 rounded-2xl border border-forest/10 bg-white/70 px-4 py-3"
          : "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
      }
    >
      <button
        type="button"
        onClick={() => void alPulsar()}
        disabled={estado === "activando" || activo}
        aria-describedby={descripcionId}
        aria-pressed={activo}
        className={`inline-flex items-center justify-center rounded-full border text-xs font-semibold shadow-sm transition disabled:cursor-default disabled:opacity-90 ${
          activo
            ? "border-forest/25 bg-forest/10 text-forest"
            : "border-forest/15 bg-white/80 text-forest hover:border-atlantic/40 hover:bg-white"
        } ${enFicha ? "px-4 py-2" : "px-3 py-1.5"} ${estado === "activando" ? "cursor-wait" : ""}`}
      >
        {estado === "activando" ? "Activando…" : activo ? "Avisos activados" : "Activar avisos"}
      </button>
      <p
        id={descripcionId}
        className={`leading-snug text-ink/55 ${enFicha ? "mt-2 text-sm" : "max-w-xs text-[11px]"}`}
      >
        {TEXTO_AVISOS}
      </p>
      {estado === "error" ? (
        <p role="alert" className={`text-xs font-semibold text-fire ${enFicha ? "mt-2" : "w-full"}`}>
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
