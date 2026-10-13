"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  debeMostrarBannerPropio,
  EVENTO_CONFIGURAR_COOKIES,
  fundingChoices,
} from "@/lib/consentimiento-cookies";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  buildCookieConsent,
  parseCookieConsent,
} from "@/lib/legal";

const ESPERA_CMP_MS = 5000;

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
      cerrado.current = false;
      reabierto.current = true;
      sync();
    }

    // El mensaje de Google es el único aviso. Este banner es solo respaldo:
    // se muestra si tras unos segundos googlefc no ha aparecido.
    let pulso = 0;
    const espera = window.setTimeout(() => {
      sync();
      pulso = window.setInterval(sync, 1000);
    }, ESPERA_CMP_MS);
    const fin = window.setTimeout(() => window.clearInterval(pulso), ESPERA_CMP_MS + 10000);
    window.addEventListener(EVENTO_CONFIGURAR_COOKIES, reabrir);
    return () => {
      window.clearTimeout(espera);
      window.clearInterval(pulso);
      window.clearTimeout(fin);
      window.removeEventListener(EVENTO_CONFIGURAR_COOKIES, reabrir);
    };
  }, []);

  function aceptar() {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(buildCookieConsent(true)));
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
    reabierto.current = false;
    cerrado.current = true;
    setVisible(false);
  }

  function rechazar() {
    window.localStorage.removeItem(COOKIE_CONSENT_KEY);
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
