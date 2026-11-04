/**
 * Ajustes SEO por ficha (encargo SEO 04-11-2026, datos de Search Console a 02-11).
 *
 * Solo datos confirmados en la web oficial, el reglamento o la plataforma de
 * inscripción/cronometraje de cada prueba. No cambia ninguna URL ni ningún noindex.
 */

export type FichaSeo = {
  /** <title> absoluto (≤60 caracteres, sin « · Carreras Asturias»). */
  title: string;
  /** Meta description. */
  description: string;
};

export const FICHAS_SEO: Record<string, FichaSeo> = {
  // Avaibook (inscripción oficial): 8-11-2026 12:00, Pedrero 50, Trasona (Corvera); individual, parejas y equipos.
  // «Híbrida» y «ParqueAstur» solo salen en prensa, no en la web oficial: fuera (regla del encargo).
  // El slug lleva 10-11 pero no se toca (encargo SEO).
  "mysterioux-race-2026-2026-10-11-pie": {
    title: "Mysterioux Race 2026 en Corvera: domingo 8 de noviembre",
    description:
      "Mysterioux Race 2026 en Trasona (Corvera de Asturias) el domingo 8 de noviembre: individual, parejas o equipos. Web oficial y clasificación al acabar.",
  },
  // Reglamento oficial: VII Carrera Popular Llangréu Natural, Ayuntamiento de Langreo, 18-10-2026; cronometra Boomerang. RockTheSport: 10 km.
  "llangreu-natural-2026-vii-carrera-popular-2026-10-18-pie": {
    title: "Llangreu Natural 2026 (Langreo): clasificación y resultados",
    description:
      "Clasificación de la VII Llangreu Natural, carrera popular de 10 km en Langreo del 18 de octubre de 2026: resultados oficiales y web de la prueba.",
  },
  // enduroteamrace.com + reglamento + empa-t: 8-11-2026, Cocañín (SMRA), organiza FESORIA EVENTS.
  "enduro-team-race-cocanin-2026-2026-11-08-ciclismo": {
    title: "Enduro Cocañín 2026: Team Race, domingo 8 de noviembre",
    description:
      "Enduro Team Race Cocañín 2026 en Cocañín (San Martín del Rey Aurelio), domingo 8 de noviembre. Organiza Fesoria Events. Web oficial y clasificación.",
  },
  // empa-t: 31-10-2026, Pola de Laviana, CALEYU EVENTS; clasificación publicada en empa-t.com/resultados.
  "trail-coto-musel-2-0-2026": {
    title: "IV Trail Coto Musel 2.0 2026 (Laviana): clasificación",
    description:
      "IV Trail Coto Musel 2.0, trail de Pola de Laviana del sábado 31 de octubre de 2026, organizado por Caleyu Events. Web oficial y clasificación.",
  },
};

/**
 * Solo title (la description sale de la plantilla 140-150). Ejemplos de la regla
 * «{Nombre}: clasificación…» del encargo; el detalle sale de los datos de la ficha
 * (distancias K22/K13 de Suarías; Naveces es el Campeonato de Asturias BTT Maratón).
 */
export const TITULOS_SEO: Record<string, string> = {
  "suarias-blincapenas-2026": "XIII Suarías Blincapeñas 2026: clasificación K22 y K13",
  "vuelta-btt-naveces-campeonato-asturias-2026": "XII Vuelta BTT Naveces 2026: clasificación del Campeonato",
};

/**
 * Clasificaciones oficiales localizadas a mano mientras el buscador no las recoja.
 * Solo se usan si la fila de la BBDD no trae url_clasificacion (la BBDD manda).
 */
export const CLASIFICACIONES_MANUALES: Record<string, string> = {
  // Cronometraje de Boomerang Eventos (reglamento oficial, punto 9).
  "llangreu-natural-2026-vii-carrera-popular-2026-10-18-pie":
    "https://boomerangeventos.es/wordpress/results/llangreu-natural-2026",
  // Resultados de empa-t (plataforma oficial de inscripción y cronometraje).
  "trail-coto-musel-2-0-2026": "https://www.empa-t.com/resultados/4o-trail-coto-musel2-0-2026/",
};

export function fichaSeo(id: string): FichaSeo | null {
  return FICHAS_SEO[id] ?? null;
}

export function tituloSeo(id: string): string | null {
  return FICHAS_SEO[id]?.title ?? TITULOS_SEO[id] ?? null;
}

export function clasificacionManual(id: string): string | null {
  return CLASIFICACIONES_MANUALES[id] ?? null;
}
