"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useInterruptores } from "@/lib/use-interruptores";

const AvilesiaBarra = dynamic(() => import("./avilesia-barra").then((m) => m.AvilesiaBarra), { ssr: false });
const CookieBanner = dynamic(() => import("./cookie-banner").then((m) => m.CookieBanner), { ssr: false });
const AdsenseConsent = dynamic(() => import("./adsense-consent").then((m) => m.AdsenseConsent), {
  ssr: false,
});

type W = Window & {
  requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Lo que no hace falta para pintar la página (barra AvilesIA, aviso de cookies,
 * CMP de Google / AdSense) se monta tras `load` y en reposo del hilo principal.
 * El consentimiento queda denegado por defecto desde el <head> (CONSENT_DEFAULT_SCRIPT).
 */
export function Diferidos() {
  const [listo, setListo] = useState(false);
  // Interruptor AdSense (Cuadro de Mandos).
  const interruptores = useInterruptores();
  // El aviso de respaldo va aparte: su propio temporizador desde la carga,
  // sin depender de `load`, del reposo ni de Google. Se monta a los ~3,5 s
  // para que su chunk esté listo y él mismo decide a los 4,75 s.
  const [bannerListo, setBannerListo] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setBannerListo(true), Math.max(0, 3500 - performance.now()));
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const w = window as W;
    let idle = 0;
    let t = 0;
    const ir = () => {
      if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setListo(true), { timeout: 3000 });
      else t = window.setTimeout(() => setListo(true), 1200);
    };
    if (document.readyState === "complete") ir();
    else window.addEventListener("load", ir, { once: true });
    return () => {
      window.removeEventListener("load", ir);
      if (idle && w.cancelIdleCallback) w.cancelIdleCallback(idle);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <>
      {bannerListo ? <CookieBanner /> : null}
      {listo ? (
        <>
          <AvilesiaBarra />
          {interruptores?.adsense ? <AdsenseConsent /> : null}
        </>
      ) : null}
    </>
  );
}
