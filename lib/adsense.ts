export const ADSENSE_CLIENT = "ca-pub-5660728155340779";

export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

type EnvLike = Record<string, string | undefined>;

/**
 * Slot del bloque in-feed. Vacío o ausente → no hay anuncio.
 * No hay un slot de reserva: si la variable no está, no se pinta el <ins>.
 */
export function slotAnuncioInfeed(env: EnvLike = process.env): string | null {
  const raw = env.NEXT_PUBLIC_ADSENSE_SLOT;
  if (typeof raw !== "string") return null;
  const slot = raw.trim();
  return slot.length > 0 ? slot : null;
}

/** Posición del anuncio entre tarjetas (índice de la tarjeta delante de la cual se inserta). */
export function indiceAnuncioEntreTarjetas(total: number): number | null {
  if (total < 2) return null;
  return total >= 4 ? 3 : 1;
}
