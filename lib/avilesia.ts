import type { ModalidadId } from "@/lib/modalidad";
import type { Evento } from "@/lib/types";

/**
 * Enlaces a AvilesIA. Direcciones finales y sin utm_ (SEO 15-oct-2026): sin
 * redirecciones (www, asturguia) ni parámetros. Si hay que medir, con un evento
 * de analítica al hacer clic, nunca en la URL.
 */
export const AVILESIA_URL = "https://avilesia.es/";
export const AVILESIA_GUIA_URL = "https://audioguias.avilesia.es/";
export const AVILESIA_PLANES_URL = "https://planes.avilesia.es/";

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
