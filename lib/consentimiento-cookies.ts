export const EVENTO_CONFIGURAR_COOKIES = "ca-configurar-cookies";

type GoogleFundingChoices = {
  showRevocationMessage: () => void;
};

/** CMP de AdSense («Privacidad y mensajes»), si el script de Google ya la ha puesto. */
export function fundingChoices(): GoogleFundingChoices | null {
  if (typeof window === "undefined") return null;
  const fc = (window as Window & { googlefc?: { showRevocationMessage?: unknown } }).googlefc;
  // El stub `googlefc = {__fci}` (Funding Choices no cargado) cuenta como «sin CMP».
  if (!fc || typeof fc.showRevocationMessage !== "function") return null;
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
  // Respaldo: el banner propio (si aún no se ha montado, lo lee al montar).
  (window as Window & { __caReabrirCookies?: boolean }).__caReabrirCookies = true;
  window.dispatchEvent(new Event(EVENTO_CONFIGURAR_COOKIES));
}

type AlmacenMinimo = Pick<Storage, "setItem">;

/**
 * Guarda la decisión del banner propio. «Aceptar» → marketing:true;
 * «Rechazar no esenciales» → marketing:false (se recuerda y el banner no vuelve).
 * Solo «Configurar cookies» reabre el banner para cambiarla.
 */
export function guardarDecisionCookies(
  almacen: AlmacenMinimo,
  clave: string,
  aceptar: boolean,
  ahora: Date = new Date(),
): string {
  const valor = JSON.stringify({
    version: 1,
    necessary: true,
    analytics: aceptar,
    marketing: aceptar,
    decidedAt: ahora.toISOString(),
  });
  almacen.setItem(clave, valor);
  return valor;
}
