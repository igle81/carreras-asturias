"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_KEY,
  buildCookieConsent,
  parseCookieConsent,
} from "@/lib/legal";

/**
 * Banner mínimo de consentimiento. Hoy no carga analítica ni marketing:
 * solo persiste la decisión para un hueco futuro (scripts de terceros).
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY));
    if (!existing) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "11rem";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [visible]);

  function persist(allowNonEssential: boolean) {
    window.localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify(buildCookieConsent(allowNonEssential)),
    );
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
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-forest/15 bg-forest px-5 py-4 text-fog shadow-xl shadow-ink/20">
        <div>
          <p id="cookie-banner-title" className="font-display text-lg font-bold">
            Cookies y privacidad
          </p>
          <p id="cookie-banner-desc" className="mt-1 text-sm text-fog/80">
            Usamos almacenamientos técnicos necesarios. La analítica y el
            marketing no están activos. Puedes aceptar o rechazar los no
            esenciales. Más detalle en la{" "}
            <Link href="/cookies" className="font-semibold text-gold underline underline-offset-2">
              política de cookies
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => persist(false)}
            className="rounded-full border border-fog/30 bg-transparent px-4 py-2.5 text-sm font-bold text-fog transition hover:bg-white/10"
          >
            Rechazar no esenciales
          </button>
          <button
            type="button"
            onClick={() => persist(true)}
            className="rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-gold/90"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
