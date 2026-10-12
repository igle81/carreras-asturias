"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense";

/**
 * Bloque in-feed. Si no hay slot, no pinta el <ins>.
 * El slot solo llega desde NEXT_PUBLIC_ADSENSE_SLOT.
 */
export function AnuncioInfeed({ slot }: { slot: string | null }) {
  useEffect(() => {
    if (!slot) return;
    const ventana = window as Window & { adsbygoogle?: Record<string, unknown>[] };
    ventana.adsbygoogle = ventana.adsbygoogle || [];
    try {
      ventana.adsbygoogle.push({});
    } catch {
      // La cola del script puede rechazar un push duplicado en el mismo hueco.
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <aside
      aria-label="Publicidad"
      className="flex h-full min-h-24 items-center rounded-3xl border border-dashed border-forest/15 bg-white/60 px-3 py-3"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="fluid"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
