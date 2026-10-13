export const ADSENSE_CLIENT = "ca-pub-5660728155340779";

export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

export const FUNDING_CHOICES_SRC = "https://fundingchoicesmessages.google.com/i/pub-5660728155340779?ers=1";

/** Snippet estándar de Google para señalar la presencia de Funding Choices. */
export const GOOGLEFC_PRESENT_SCRIPT =
  "(function(){function signalGooglefcPresent(){if(!window.frames['googlefcPresent']){if(document.body){const iframe=document.createElement('iframe');iframe.style='width:0;height:0;border:none;z-index:-1000;left:-1000px;top:-1000px;';iframe.style.display='none';iframe.name='googlefcPresent';document.body.appendChild(iframe);}else{setTimeout(signalGooglefcPresent,0);}}}signalGooglefcPresent();})();";

type TcData = {
  eventStatus?: string;
  tcString?: string;
  gdprApplies?: boolean;
  purpose?: { consents?: Record<string, boolean> };
};

/** ¿La decisión TCF permite cargar AdSense? Necesita propósito 1 (almacenar/acceder). */
export function tcfPermiteAnuncios(tc: TcData | null | undefined): boolean {
  if (!tc) return false;
  if (tc.eventStatus !== "useractioncomplete" && tc.eventStatus !== "tcloaded") return false;
  if (tc.gdprApplies === false) return true;
  return Boolean(tc.tcString) && tc.purpose?.consents?.["1"] === true;
}

export const CONSENT_DEFAULT_SCRIPT =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});";

const RUTAS_SIN_ANUNCIO = ["/avisos", "/registro", "/acceso", "/interno", "/alertas", "/vip"];

/** Anuncios solo en páginas públicas. Cuenta, avisos e interno quedan fuera. */
export function paginaPublicaParaAnuncios(pathname: string): boolean {
  const ruta = pathname.split("?")[0] || "/";
  return !RUTAS_SIN_ANUNCIO.some((prefijo) => ruta === prefijo || ruta.startsWith(`${prefijo}/`));
}

/**
 * Consentimiento que aplica el banner propio de respaldo (sin CMP de Google).
 * Siempre todo denegado: sin CMP certificada no se concede nada, ni tras «Aceptar».
 */
export function consentimientoRespaldo(): Record<
  "ad_storage" | "ad_user_data" | "ad_personalization" | "analytics_storage",
  "denied"
> {
  return {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  };
}

/**
 * Si al ir de una página pública a `destino` hace falta carga completa
 * (para que adsbygoogle.js no siga vivo en cuenta, avisos, interno o VIP).
 */
export function requiereCargaCompleta(origen: string, destino: string): boolean {
  return paginaPublicaParaAnuncios(origen) && !paginaPublicaParaAnuncios(destino);
}

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
