"use client";

import {
  DESTINOS_CICLISMO,
  DESTINOS_DECATHLON,
  DESTINOS_PIE,
  REL_AFILIADO,
  enlaceAwinDecathlon,
  type DestinoDecathlonId,
} from "@/lib/awin-decathlon";
import { useInterruptores } from "@/lib/use-interruptores";

type Modalidad = "pie" | "ciclismo";

const TEXTOS: Record<Modalidad, { aria: string; titulo: string; texto: string }> = {
  pie: {
    aria: "Running y trail en Decathlon",
    titulo: "Material para salir a correr",
    texto: "Zapatillas de trail y de asfalto y ropa de running en Decathlon.",
  },
  ciclismo: {
    aria: "Ciclismo en Decathlon",
    titulo: "Material para salir en bici",
    texto: "Bicicletas, ropa y accesorios de ciclismo de carretera en Decathlon.",
  },
};

export function DecathlonAfiliado({
  className = "",
  modalidad = "pie",
}: {
  className?: string;
  modalidad?: Modalidad;
}) {
  const destinos: DestinoDecathlonId[] = modalidad === "ciclismo" ? DESTINOS_CICLISMO : DESTINOS_PIE;
  const textos = TEXTOS[modalidad];
  // Interruptor Decathlon (Cuadro de Mandos): apagado no pinta nada.
  const interruptores = useInterruptores();
  if (!interruptores?.decathlon) return null;

  function registrarClic(destino: DestinoDecathlonId) {
    const body = JSON.stringify({ path: window.location.pathname, destino });
    void fetch("/api/afiliado/clic", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  }

  return (
    <aside
      aria-label={textos.aria}
      className={`rounded-3xl border border-forest/10 bg-white px-5 py-4 shadow-[0_10px_30px_-22px_rgba(11,61,46,0.45)] ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">
        Publicidad · Enlace de afiliado
      </p>
      <h2 className="mt-1 font-display text-xl font-bold text-ink">{textos.titulo}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted">
        {textos.texto} Enlace de afiliado de AvilesIA: si compras, podemos recibir una comisión sin coste para ti.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {destinos.map((id) => {
          const destino = DESTINOS_DECATHLON[id];
          return (
            <li key={id}>
              <a
                href={enlaceAwinDecathlon(destino.url)}
                target="_blank"
                rel={REL_AFILIADO}
                onClick={() => registrarClic(id)}
                className="inline-flex min-h-11 items-center rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink transition hover:bg-gold/80"
              >
                {destino.etiqueta}
                <span className="sr-only"> en Decathlon (enlace de afiliado, se abre en otra pestaña)</span>
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
