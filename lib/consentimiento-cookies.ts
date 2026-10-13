export const EVENTO_CONFIGURAR_COOKIES = "ca-configurar-cookies";

type GoogleFundingChoices = {
  showRevocationMessage: () => void;
};

/** CMP de AdSense («Privacidad y mensajes»), si el script de Google ya la ha puesto. */
export function fundingChoices(): GoogleFundingChoices | null {
  if (typeof window === "undefined") return null;
  const fc = (window as Window & { googlefc?: { showRevocationMessage?: unknown } }).googlefc;
  if (!fc) return null;
  if (typeof fc.showRevocationMessage !== "function") {
    // googlefc existe pero aún no está listo: lo tratamos como presente.
    return { showRevocationMessage: () => window.setTimeout(abrirConfiguracionCookies, 500) };
  }
  return fc as GoogleFundingChoices;
}

/**
 * Con la CMP de Google no mostramos el banner propio.
 * Sin ella, el banner sale si no hay decisión o si el usuario lo reabre.
 */
export function debeMostrarBannerPropio(opciones: {
  googleFc: boolean;
  tieneDecision: boolean;
  reabierto: boolean;
}): boolean {
  if (opciones.googleFc) return false;
  return opciones.reabierto || !opciones.tieneDecision;
}

/** Abre el mensaje de Google si existe; si no, el banner propio. */
export function abrirConfiguracionCookies() {
  const fc = fundingChoices();
  if (fc) {
    fc.showRevocationMessage();
    return;
  }
  window.dispatchEvent(new Event(EVENTO_CONFIGURAR_COOKIES));
}
