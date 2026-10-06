import type { ModalidadId } from "@/lib/modalidad";
import type { Evento } from "@/lib/types";

/**
 * Enlaces a AvilesIA (Javier 2026-10-06). Marca escrita «AvilesIA», sin ®.
 *
 * Ojo: Javier pidió guia.avilesia.es y planes.avilesia.es, pero el 6-oct esos
 * subdominios apuntan al parking de DonDominio (sin web ni certificado). Se usan
 * las URLs reales que enlaza www.avilesia.es. Si se activan esos subdominios,
 * basta con cambiarlos aquí.
 */
const UTM = "utm_source=carrerasasturias.es&utm_medium=web";

export const AVILESIA_URL = `https://www.avilesia.es/?${UTM}&utm_campaign=ecosistema`;
export const AVILESIA_GUIA_URL = `https://asturguia.avilesia.es/?${UTM}&utm_campaign=guia`;
export const AVILESIA_PLANES_URL = `https://asturplania.avilesia.es/?${UTM}&utm_campaign=planes`;

/** Concejos de Avilés y comarca (sin tildes, en minúscula). */
const COMARCA_AVILES = [
  "aviles",
  "castrillon",
  "corvera",
  "gozon",
  "illas",
  "soto del barco",
  "carreno",
  "muros de nalon",
  // Localidades conocidas de esos concejos
  "salinas",
  "piedras blancas",
  "luanco",
  "candas",
  "naveces",
  "monteareo",
] as const;

function normaliza(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function esComarcaAviles(
  event: Pick<Evento, "municipio" | "municipio_meta" | "localidad">,
): boolean {
  const texto = [event.municipio, event.municipio_meta, event.localidad].map(normaliza).join(" | ");
  return COMARCA_AVILES.some((nombre) => new RegExp(`(^|[^a-z])${nombre}([^a-z]|$)`).test(texto));
}

export function escapadaTitulo(modalidad: ModalidadId, comarca: boolean): string {
  const verbo = modalidad === "ciclismo" ? "rodar" : "correr";
  return comarca
    ? `¿Vienes a ${verbo} a Avilés? Prepara tu fin de semana`
    : `¿Vienes a ${verbo} a Asturias? Prepara tu escapada`;
}
