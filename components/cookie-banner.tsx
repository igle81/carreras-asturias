"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  debeMostrarBannerPropio,
  EVENTO_CONFIGURAR_COOKIES,
  fundingChoices,
  guardarDecisionCookies,
} from "@/lib/consentimiento-cookies";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  parseCookieConsent,
} from "@/lib/legal";

/** Margen para que Funding Choices pinte su mensaje tras inyectarse. */
const ESPERA_CMP_MS = 2500;
/** El respaldo sale como pronto a los 4,5 s de la carga (objetivo 4-5 s). */
const MINIMO_DESDE_CARGA_MS = 4500;

/** Banner fijo: no empuja el contenido (evita un salto de layout). */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const reabierto = useRef(false);
  const cerrado = useRef(false);

  useEffect(() => {
    function sync() {
      const googleFc = Boolean(fundingChoices());
      if (googleFc) {
        reabierto.current = false;
        cerrado.current = true;
        setVisible(false);
        return;
      }
      if (cerrado.current && !reabierto.current) {
        setVisible(false);
        return;
      }
      const tieneDecision = Boolean(parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY)));
      setVisible(
        debeMostrarBannerPropio({ googleFc, tieneDecision, reabierto: reabierto.current }),
      );
    }

    function reabrir() {
      (window as Window & { __caReabrirCookies?: boolean }).__caReabrirCookies = false;
      cerrado.current = false;
      reabierto.current = true;
      sync();
    }

    // El mensaje de Google es el único aviso. Este banner es solo respaldo:
    // se muestra si tras unos segundos googlefc no ha aparecido.
    // La espera cuenta desde que se inyecta Funding Choices (que va diferido).
    let pulso = 0;
    let espera = 0;
    let fin = 0;
    const arrancar = () => {
      if (espera) return;
      const restante = Math.max(ESPERA_CMP_MS, MINIMO_DESDE_CARGA_MS - performance.now());
      espera = window.setTimeout(() => {
        sync();
        pulso = window.setInterval(sync, 1000);
      }, restante);
      fin = window.setTimeout(() => window.clearInterval(pulso), ESPERA_CMP_MS + 10000);
    };
    if ((window as Window & { __caFcInyectado?: number }).__caFcInyectado) arrancar();
    else window.addEventListener("ca-fc-inyectado", arrancar, { once: true });
    // Páginas sin CMP (cuenta, avisos): arranca igualmente.
    const seguro = window.setTimeout(arrancar, Math.max(0, 3000 - performance.now()));
    window.addEventListener(EVENTO_CONFIGURAR_COOKIES, reabrir);
    if ((window as Window & { __caReabrirCookies?: boolean }).__caReabrirCookies) reabrir();
    return () => {
      window.removeEventListener("ca-fc-inyectado", arrancar);
      window.clearTimeout(espera);
      window.clearTimeout(seguro);
      window.clearInterval(pulso);
      window.clearTimeout(fin);
      window.removeEventListener(EVENTO_CONFIGURAR_COOKIES, reabrir);
    };
  }, []);

  function aceptar() {
    guardarDecisionCookies(window.localStorage, COOKIE_CONSENT_KEY, true);
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
    reabierto.current = false;
    cerrado.current = true;
    setVisible(false);
  }

  function rechazar() {
    guardarDecisionCookies(window.localStorage, COOKIE_CONSENT_KEY, false);
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
    reabierto.current = false;
    cerrado.current = true;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed inset-x-0 bottom-0 z-50 p-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-forest/15 bg-forest px-5 py-4 text-white shadow-xl shadow-ink/20">
        <div>
          <p id="cookie-banner-title" className="font-display text-lg font-bold">
            Cookies y privacidad
          </p>
          <p id="cookie-banner-desc" className="mt-1 text-sm text-white">
            Usamos almacenamientos técnicos necesarios. Los anuncios de Google
            no usan cookies hasta que pulsas Aceptar. Puedes rechazar el resto.
            Más detalle en la{" "}
            <Link href="/cookies" className="font-semibold text-white underline underline-offset-2">
              política de cookies
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={rechazar}
            className="rounded-full border border-white/40 bg-transparent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Rechazar no esenciales
          </button>
          <button
            type="button"
            onClick={aceptar}
            className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-forest transition hover:bg-fog"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
