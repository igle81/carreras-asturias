"use client";

import { useRef, useState } from "react";
import { recordVipCtaClick } from "@/lib/vip-cta";

const TOAST_MS = 4000;

const CTA_CLASS =
  "mt-6 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink";

function recordClick() {
  void recordVipCtaClick({
    path: window.location.pathname,
    userAgent: window.navigator.userAgent,
  });
}

/**
 * PRE / preview: active Stripe test checkout. Production stays interest-only
 * unless a checkout URL is configured. Never add a t.me / Telegram href.
 */
export function VipPromo({ checkoutUrl = null }: { checkoutUrl?: string | null }) {
  const [toast, setToast] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const checkoutEnabled = Boolean(checkoutUrl);

  function handleInterestClick() {
    recordClick();
    setToast(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setToast(false), TOAST_MS);
  }

  return (
    <section id="vip" className="mx-auto max-w-6xl px-4">
      <div className="overflow-hidden rounded-[2rem] bg-ink px-6 py-8 text-white sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Tranquilidad · cero esfuerzo
        </p>
        <h2 className="mt-2 font-display text-3xl font-black">
          Todas las carreras, sin mover un dedo
        </h2>
        <p className="mt-3 max-w-xl text-white/75">
          Todas las carreras de Asturias en la palma de tu mano, sin mover un
          dedo. Recibe un aviso en tu móvil en el momento exacto en que se abre
          cualquier inscripción de Trail, Asfalto o BTT. Ahorra tiempo y no
          vuelvas a quedarte fuera.
        </p>
        <div className="mt-5 max-w-xl rounded-2xl border-2 border-gold bg-gold/15 px-4 py-3">
          <p className="text-sm font-bold text-gold">
            Máximo 100 suscriptores VIP activos.
          </p>
        </div>
        <p className="mt-3 max-w-xl text-sm text-white/75">
          Baja en un clic, sin fricción.
        </p>
        {checkoutEnabled && checkoutUrl ? (
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={recordClick}
            className={CTA_CLASS}
          >
            Quiero el Canal VIP
          </a>
        ) : (
          <button type="button" onClick={handleInterestClick} className={CTA_CLASS}>
            Quiero avisos VIP
            <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink/70">
              Próximamente
            </span>
          </button>
        )}
        {!checkoutEnabled && toast ? (
          <p role="status" className="mt-3 text-sm font-semibold text-gold">
            Te avisaremos — llega en breve
          </p>
        ) : null}
      </div>
    </section>
  );
}
