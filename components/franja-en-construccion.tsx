import { esEntornoPre } from "@/lib/entorno-pre";

/** Aviso de preproducción. En producción o sin señal de PRE no pinta nada. */
export function FranjaEnConstruccion() {
  if (!esEntornoPre()) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-gold px-4 py-1.5 text-center text-sm font-semibold text-ink"
    >
      En construcción
    </div>
  );
}
