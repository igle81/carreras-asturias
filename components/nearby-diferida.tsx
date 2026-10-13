"use client";

import dynamic from "next/dynamic";

/** Listado «Cerca de ti» + mapa: su JS se descarga solo al acercarse. */
export const NearbySectionDiferida = dynamic(
  () => import("./nearby-section").then((m) => m.NearbySection),
  { ssr: false, loading: () => <div className="mx-auto max-w-6xl px-4 text-sm text-muted">Cargando…</div> },
);
