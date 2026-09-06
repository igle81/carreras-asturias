"use client";

import { useRef, useState } from "react";

const TOAST_MS = 4000;

function recordClick() {
  const path = typeof window === "undefined" ? "/" : window.location.pathname || "/";
  void fetch("/api/vip-cta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
    keepalive: true,
  }).catch(() => {
    // Fire-and-forget: the CTA never waits on tracking.
  });
}

export function VipPromo() {
  const [toast, setToast] = useState(false);
  const hideTimer = useRef<number | null>(null);

  function handleClick() {
    recordClick();
    setToast(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setToast(false), TOAST_MS);
  }

  return (
    <section id="vip" className="mx-auto max-w-6xl px-4">
      <div className="overflow-hidden rounded-[2rem] bg-ink px-6 py-8 text-white sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Telegram</p>
        <h2 className="mt-2 font-display text-3xl font-black">Canal VIP de Alertas</h2>
        <p className="mt-3 max-w-xl text-white/75">
          Cuando se abre una inscripción, te avisamos al momento. Sin ruido, sin
          quedarte sin dorsal. El canal llega en breve — deja el sitio marcado.
        </p>
        <a
          href="#vip"
          onClick={handleClick}
          className="mt-6 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink"
        >
          Quiero el Canal VIP
        </a>
        {toast ? (
          <p role="status" className="mt-3 text-sm font-semibold text-gold">
            Te avisaremos — canal en breve
          </p>
        ) : null}
      </div>
    </section>
  );
}
