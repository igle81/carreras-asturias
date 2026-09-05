"use client";

import { useGeo } from "./geo-provider";

type GeoButtonProps = {
  compact?: boolean;
  className?: string;
};

export function GeoButton({ compact = false, className = "" }: GeoButtonProps) {
  const { status, requestLocation } = useGeo();

  const label =
    status === "granted"
      ? "📍 Ubicación activa"
      : status === "pending"
        ? "📍 Buscando…"
        : "📍 Encontrar carreras cerca de mí";

  return (
    <button
      type="button"
      onClick={requestLocation}
      disabled={status === "pending"}
      className={`inline-flex items-center justify-center rounded-full border border-forest/15 bg-white/80 text-forest shadow-sm transition hover:border-atlantic/40 hover:bg-white disabled:opacity-70 ${
        compact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
      } ${className}`}
    >
      {label}
    </button>
  );
}
