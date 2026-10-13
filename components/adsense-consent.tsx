"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE_SCRIPT_SRC, paginaPublicaParaAnuncios } from "@/lib/adsense";
import { fundingChoices } from "@/lib/consentimiento-cookies";
import { COOKIE_CONSENT_EVENT, parseCookieConsent, COOKIE_CONSENT_KEY } from "@/lib/legal";

type Gtag = (...args: unknown[]) => void;

function gtagConsent(): Gtag | undefined {
  return (window as Window & { gtag?: Gtag }).gtag;
}

function cargarAdsense() {
  if (document.querySelector("script[data-adsense='1']")) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = ADSENSE_SCRIPT_SRC;
  script.crossOrigin = "anonymous";
  script.dataset.adsense = "1";
  document.head.appendChild(script);
}

/** Solo para el banner de respaldo (cuando la CMP de Google no aparece). */
function aplicarRespaldo() {
  if (fundingChoices()) return;
  let marketing = false;
  try {
    marketing = parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY))?.marketing === true;
  } catch {
    marketing = false;
  }
  const valor = marketing ? "granted" : "denied";
  gtagConsent()?.("consent", "update", {
    ad_storage: valor,
    ad_user_data: valor,
    ad_personalization: valor,
  });
}

/**
 * En páginas públicas carga adsbygoogle.js con Consent Mode v2 denegado por
 * defecto. El mensaje certificado de Google (TCF) es el único aviso: él pide
 * y actualiza el consentimiento. Cuenta, avisos e interno no cargan AdSense.
 */
export function AdsenseConsent() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!paginaPublicaParaAnuncios(pathname)) return;
    cargarAdsense();
    window.addEventListener(COOKIE_CONSENT_EVENT, aplicarRespaldo);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, aplicarRespaldo);
  }, [pathname]);

  return null;
}
