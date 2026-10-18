/** Colores de marca usados en contraste AA (texto). */
export const COLOR_GOLD = "#e0b44a";
/** Dorado oscuro para texto sobre fog/blanco (≥4.5:1). */
export const COLOR_GOLD_TEXT = "#7a5c10";
export const COLOR_FOG = "#f4f1ea";
export const COLOR_INK = "#12231c";
/** Rojo de error sobre fondos claros (fog/blanco). */
export const COLOR_FIRE = "#c62828";
/** Rojo de error sobre fondos oscuros (ink). */
export const COLOR_FIRE_CLARO = "#ff8a80";

function canalLineal(valor: number): number {
  const c = valor / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminanciaRelativa(hex: string): number {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return 0.2126 * canalLineal(r) + 0.7152 * canalLineal(g) + 0.0722 * canalLineal(b);
}

/** Ratio de contraste WCAG entre dos colores hex #RRGGBB. */
export function ratioContraste(frente: string, fondo: string): number {
  const a = luminanciaRelativa(frente);
  const b = luminanciaRelativa(fondo);
  const claro = Math.max(a, b);
  const oscuro = Math.min(a, b);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** AA texto normal: ≥4.5:1. */
export function cumpleAaTexto(frente: string, fondo: string): boolean {
  return ratioContraste(frente, fondo) >= 4.5;
}
