/** Aviso en todas las páginas, también en producción, hasta el visto bueno. */
export function FranjaEnConstruccion() {
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
