"use client";

import { useEffect, useState } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY, parseCookieConsent } from "@/lib/legal";
import { useInterruptores } from "@/lib/use-interruptores";

/**
 * Bloque in-feed. Si no hay slot, no pinta el <ins>.
 * El slot solo llega desde NEXT_PUBLIC_ADSENSE_SLOT.
 */
export function AnuncioInfeed({ slot }: { slot: string | null }) {
  const [permitido, setPermitido] = useState(false);
  const adsense = useInterruptores()?.adsense === true;

  useEffect(() => {
    function leer() {
      try {
        setPermitido(parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY))?.marketing === true);
      } catch {
        setPermitido(false);
      }
    }
    leer();
    window.addEventListener(COOKIE_CONSENT_EVENT, leer);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, leer);
  }, []);

  useEffect(() => {
    if (!slot || !permitido || !adsense) return;
    const ventana = window as Window & { adsbygoogle?: Record<string, unknown>[] };
    ventana.adsbygoogle = ventana.adsbygoogle || [];
    try {
      ventana.adsbygoogle.push({});
    } catch {
      // La cola del script puede rechazar un push duplicado en el mismo hueco.
    }
  }, [slot, permitido, adsense]);

  if (!slot || !permitido || !adsense) return null;

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
