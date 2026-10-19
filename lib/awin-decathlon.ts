/**
 * Enlaces de afiliado de Decathlon España por Awin.
 * Editor AvilesIA 3128193 · anunciante Decathlon ES 105405.
 * Las URLs de destino se comprobaron con un GET (200) el 19-10-2026.
 */
export const AWIN_DECATHLON_MID = "105405";
export const AWIN_EDITOR_ID = "3128193";
export const AWIN_CREAD_BASE = "https://www.awin1.com/cread.php";

const HOST_DECATHLON = "www.decathlon.es";

export type DestinoDecathlonId = "zapatillas-trail" | "zapatillas-asfalto" | "ropa-running" | "ciclismo-carretera";

export type DestinoDecathlon = {
  id: DestinoDecathlonId;
  etiqueta: string;
  url: string;
};

export const DESTINOS_DECATHLON: Record<DestinoDecathlonId, DestinoDecathlon> = {
  "zapatillas-trail": {
    id: "zapatillas-trail",
    etiqueta: "Zapatillas de trail",
    url: "https://www.decathlon.es/es/deportes/trail-running/zapatillas",
  },
  "zapatillas-asfalto": {
    id: "zapatillas-asfalto",
    etiqueta: "Zapatillas de asfalto",
    url: "https://www.decathlon.es/es/deportes/running/zapatillas-running-asfalto",
  },
  "ropa-running": {
    id: "ropa-running",
    etiqueta: "Ropa de running",
    url: "https://www.decathlon.es/es/deportes/running/ropa",
  },
  "ciclismo-carretera": {
    id: "ciclismo-carretera",
    etiqueta: "Ciclismo de carretera",
    url: "https://www.decathlon.es/es/deportes/ciclismo/ciclismo-de-carretera",
  },
};

export const DESTINOS_PIE: DestinoDecathlonId[] = ["zapatillas-trail", "zapatillas-asfalto", "ropa-running"];
export const DESTINOS_CICLISMO: DestinoDecathlonId[] = ["ciclismo-carretera"];

/** Solo admite destinos https de www.decathlon.es. */
export function esUrlDecathlon(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === HOST_DECATHLON;
  } catch {
    return false;
  }
}

/**
 * Construye el enlace de Awin:
 * cread.php?awinmid=105405&awinaffid=3128193&ued=<encodeURIComponent(destino)>
 */
export function enlaceAwinDecathlon(destino: string): string {
  if (!esUrlDecathlon(destino)) {
    throw new Error("El destino del enlace de afiliado tiene que ser https://www.decathlon.es/…");
  }
  return `${AWIN_CREAD_BASE}?awinmid=${AWIN_DECATHLON_MID}&awinaffid=${AWIN_EDITOR_ID}&ued=${encodeURIComponent(destino)}`;
}

export const REL_AFILIADO = "sponsored nofollow noopener";
