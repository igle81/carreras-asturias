"use client";

import { AFILIADO_DESTINO, DECATHLON_RUNNING_HREF } from "@/lib/afiliado";

export function DecathlonAfiliado({ className = "" }: { className?: string }) {
  function registrarClic() {
    const body = JSON.stringify({ path: window.location.pathname, destino: AFILIADO_DESTINO });
    void fetch("/api/afiliado/clic", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  }

  return (
    <aside
      aria-label="Running y trail en Decathlon"
      className={`rounded-3xl border border-forest/10 bg-white px-5 py-4 shadow-[0_10px_30px_-22px_rgba(11,61,46,0.45)] ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Publicidad</p>
      <h2 className="mt-1 font-display text-xl font-bold text-ink">Material para salir a correr</h2>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Zapatillas, mochilas y ropa de trail. Enlace de afiliación de AvilesIA.
      </p>
      <a
        href={DECATHLON_RUNNING_HREF}
        target="_blank"
        rel="sponsored noopener"
        onClick={registrarClic}
        className="mt-3 inline-flex rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink transition hover:bg-gold/80"
      >
        Ver running y trail en Decathlon
      </a>
    </aside>
  );
}
