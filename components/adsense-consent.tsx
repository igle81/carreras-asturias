"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE_SCRIPT_SRC, paginaPublicaParaAnuncios } from "@/lib/adsense";
import { fundingChoices } from "@/lib/consentimiento-cookies";
import { COOKIE_CONSENT_EVENT, parseCookieConsent, COOKIE_CONSENT_KEY } from "@/lib/legal";

type Gtag = (...args: unknown[]) => void;

function consentimientoMarketing(): boolean {
  try {
    return parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY))?.marketing === true;
  } catch {
    return false;
  }
}

function gtagConsent(): Gtag | undefined {
  return (window as Window & { gtag?: Gtag }).gtag;
}

function retirarAnuncios() {
  gtagConsent()?.("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  document.querySelectorAll("script[data-adsense='1']").forEach((nodo) => nodo.remove());
}

function concederAnuncios() {
  gtagConsent()?.("consent", "update", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
  if (document.querySelector("script[data-adsense='1']")) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = ADSENSE_SCRIPT_SRC;
  script.crossOrigin = "anonymous";
  script.dataset.adsense = "1";
  document.head.appendChild(script);
}

/** Carga AdSense solo tras Aceptar y solo en páginas públicas. */
export function AdsenseConsent() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    function aplicar() {
      if (fundingChoices()) return;
      if (!paginaPublicaParaAnuncios(pathname) || !consentimientoMarketing()) {
        retirarAnuncios();
        return;
      }
      concederAnuncios();
    }
    aplicar();
    window.addEventListener(COOKIE_CONSENT_EVENT, aplicar);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, aplicar);
  }, [pathname]);

  return null;
}
