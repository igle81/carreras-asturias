import type { Evento } from "./types";

export type ModalidadId = "pie" | "ciclismo";
export type ModalidadFilter = "todas" | ModalidadId;

export const MODALIDAD_TABS: { id: ModalidadFilter; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "pie", label: "A pie" },
  { id: "ciclismo", label: "Ciclismo" },
];

const FOOT_DISCIPLINES = new Set([
  "asfalto",
  "cross",
  "marcha",
  "media_maraton",
  "mixto",
  "nocturna",
  "pie",
  "running",
  "skyrace",
  "trail",
]);

const CYCLING_DISCIPLINES = new Set([
  "bici",
  "bike",
  "btt",
  "carretera",
  "ciclista_carretera",
  "ciclismo",
  "ciclismo_otro",
  "ciclocross",
  "cicloturismo",
  "criterium",
  "cx",
  "ebike",
  "enduro",
  "gravel",
  "mountain_bike",
  "mtb",
]);

export function normalizeDisciplineKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\s-]+/g, "_");
}

function parseStoredModalidad(value: string): ModalidadId | null {
  const key = normalizeDisciplineKey(value);
  if (key === "pie" || key === "a_pie" || key === "apie") return "pie";
  if (key === "ciclismo" || key === "cycling" || key === "ciclista") return "ciclismo";
  return null;
}

export function inferModalidadFromDiscipline(disciplina: string | null | undefined): ModalidadId {
  if (!disciplina) return "pie";
  const key = normalizeDisciplineKey(disciplina);
  if (CYCLING_DISCIPLINES.has(key) || key.includes("cicl") || key.includes("mtb") || key.includes("btt") || key.includes("gravel")) {
    return "ciclismo";
  }
  if (FOOT_DISCIPLINES.has(key)) return "pie";
  return "pie";
}

export function resolveModalidad(event: Pick<Evento, "modalidad" | "disciplina_normalizada">): ModalidadId {
  if (event.modalidad && event.modalidad.trim()) {
    return parseStoredModalidad(event.modalidad) ?? inferModalidadFromDiscipline(event.disciplina_normalizada);
  }
  return inferModalidadFromDiscipline(event.disciplina_normalizada);
}

export function parseModalidadFilter(value: string | null | undefined): ModalidadFilter {
  if (value === "pie" || value === "ciclismo") return value;
  if (value === "a_pie") return "pie";
  return "todas";
}

export function matchesModalidad(event: Pick<Evento, "modalidad" | "disciplina_normalizada">, filter: ModalidadFilter) {
  if (filter === "todas") return true;
  return resolveModalidad(event) === filter;
}

export function filterByModalidad<T extends Pick<Evento, "modalidad" | "disciplina_normalizada">>(
  events: T[],
  filter: ModalidadFilter,
): T[] {
  if (filter === "todas") return events;
  return events.filter((event) => matchesModalidad(event, filter));
}

export function isMissingModalidadColumn(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    message.includes("modalidad") ||
    code === "42703" ||
    code === "PGRST204" ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

export function modalidadLabel(event: Pick<Evento, "modalidad" | "disciplina_normalizada">): string {
  return resolveModalidad(event) === "ciclismo" ? "Ciclismo" : "A pie";
}
