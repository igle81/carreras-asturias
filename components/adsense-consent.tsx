"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  ADSENSE_SCRIPT_SRC,
  FUNDING_CHOICES_SRC,
  GOOGLEFC_PRESENT_SCRIPT,
  consentimientoRespaldo,
  paginaPublicaParaAnuncios,
  requiereCargaCompleta,
  tcfPermiteAnuncios,
} from "@/lib/adsense";
import { fundingChoices } from "@/lib/consentimiento-cookies";
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY, parseCookieConsent } from "@/lib/legal";

type Gtag = (...args: unknown[]) => void;
type TcfApi = (cmd: string, version: number, cb: (tc: unknown, ok: boolean) => void) => void;
type W = Window & { gtag?: Gtag; __tcfapi?: TcfApi };

function gtagConsent(): Gtag | undefined {
  return (window as W).gtag;
}

function inyectar(src: string, dataset: string) {
  if (document.querySelector(`script[data-${dataset}='1']`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  if (dataset === "adsense") script.crossOrigin = "anonymous";
  script.setAttribute(`data-${dataset}`, "1");
  document.head.appendChild(script);
}

/** CMP certificada de Google, independiente de AdSense. */
function cargarFundingChoices() {
  inyectar(FUNDING_CHOICES_SRC, "fc");
  if (!document.querySelector("script[data-fcpresent='1']")) {
    const s = document.createElement("script");
    s.setAttribute("data-fcpresent", "1");
    s.text = GOOGLEFC_PRESENT_SCRIPT;
    document.head.appendChild(s);
  }
}

/** adsbygoogle.js solo con consentimiento, y en diferido (tras load / en idle). */
let adsensePermitido = false;

function cargarAdsenseDiferido() {
  if (!paginaPublicaParaAnuncios(window.location.pathname)) return;
  adsensePermitido = true;
  const inyectarSiSigue = () => {
    if (adsensePermitido) inyectar(ADSENSE_SCRIPT_SRC, "adsense");
  };
  const ir = () => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(inyectarSiSigue, { timeout: 4000 });
    else window.setTimeout(inyectarSiSigue, 1500);
  };
  if (document.readyState === "complete") ir();
  else window.addEventListener("load", ir, { once: true });
}

function adsenseCargado(): boolean {
  return Boolean(document.querySelector("script[data-adsense='1'], script[src*='adsbygoogle.js']"));
}

/**
 * Banner de respaldo (sin CMP de Google): con «Aceptar» se permite cargar
 * AdSense, pero el modo de consentimiento sigue todo denegado (sin
 * ad_user_data ni ad_personalization). Con «Rechazar» no se carga nada.
 */
function aplicarRespaldo() {
  if (fundingChoices()) return;
  gtagConsent()?.("consent", "update", consentimientoRespaldo());
  let aceptado = false;
  try {
    aceptado = parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY))?.marketing === true;
  } catch {
    aceptado = false;
  }
  if (aceptado) {
    cargarAdsenseDiferido();
    return;
  }
  // Consentimiento retirado: nada más de AdSense y, si ya estaba, recarga limpia.
  adsensePermitido = false;
  if (adsenseCargado()) window.location.reload();
}

/** Escucha la decisión TCF de la CMP de Google cuando esté disponible. */
function escucharTcf(): () => void {
  let parado = false;
  let intentos = 0;
  const intento = () => {
    if (parado) return;
    const api = (window as W).__tcfapi;
    if (typeof api !== "function") {
      if (intentos++ < 40) window.setTimeout(intento, 500);
      return;
    }
    api("addEventListener", 2, (tc, ok) => {
      if (!ok || parado) return;
      if (tcfPermiteAnuncios(tc as Parameters<typeof tcfPermiteAnuncios>[0])) cargarAdsenseDiferido();
      else if (adsenseCargado() && (tc as { eventStatus?: string })?.eventStatus === "useractioncomplete") {
        window.location.reload();
      }
    });
  };
  intento();
  return () => {
    parado = true;
  };
}

/** Enlaces internos hacia zona privada: carga completa, no navegación cliente. */
function interceptarEnlaces(evento: MouseEvent) {
  if (evento.defaultPrevented || evento.button !== 0) return;
  if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
  const destino = (evento.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!destino || (destino.target && destino.target !== "_self") || destino.hasAttribute("download")) return;
  const url = new URL(destino.href, window.location.href);
  if (url.origin !== window.location.origin) return;
  if (!requiereCargaCompleta(window.location.pathname, url.pathname)) return;
  evento.preventDefault();
  evento.stopPropagation();
  window.location.assign(url.href);
}

/**
 * Páginas públicas: carga la CMP de Google (Funding Choices) y solo carga
 * adsbygoogle.js tras consentimiento (TCF o «Aceptar» del respaldo).
 * Cuenta, avisos, interno y VIP no cargan nada de Google.
 */
export function AdsenseConsent() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    document.addEventListener("click", interceptarEnlaces, true);
    return () => document.removeEventListener("click", interceptarEnlaces, true);
  }, []);

  useEffect(() => {
    if (!paginaPublicaParaAnuncios(pathname)) {
      if (adsenseCargado()) window.location.reload();
      return;
    }
    cargarFundingChoices();
    const pararTcf = escucharTcf();
    if (!fundingChoices()) {
      try {
        if (parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY))?.marketing === true) {
          cargarAdsenseDiferido();
        }
      } catch {
        /* sin decisión */
      }
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, aplicarRespaldo);
    return () => {
      pararTcf();
      window.removeEventListener(COOKIE_CONSENT_EVENT, aplicarRespaldo);
    };
  }, [pathname]);

  return null;
}
