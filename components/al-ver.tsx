"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Monta `children` solo cuando el hueco se acerca a la pantalla (o tras
 * interacción): ahorra hidratación y JS del listado inferior y del mapa.
 */
export function AlVer({ children, minAlto = "40rem" }: { children: ReactNode; minAlto?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight: minAlto }}>
      {visible ? children : null}
    </div>
  );
}
