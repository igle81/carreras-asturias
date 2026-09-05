import type { ModalidadFilter } from "./modalidad";
import { normalizeDisciplineKey } from "./modalidad";
import type { Evento } from "./types";

export const FOOT_DISCIPLINE_FILTERS = [
  { id: "asfalto", label: "Asfalto" },
  { id: "trail", label: "Trail" },
  { id: "mixto", label: "Mixto/Cross" },
  { id: "media_maraton", label: "Media maratón" },
  { id: "nocturna", label: "Nocturna" },
  { id: "skyrace", label: "Skyrace" },
] as const;

export const CYCLING_DISCIPLINE_FILTERS: { id: string; label: string; aliases: string[] }[] = [
  { id: "carretera", label: "Carretera", aliases: ["carretera"] },
  { id: "mtb", label: "MTB/BTT", aliases: ["mtb", "btt", "mountain_bike"] },
  { id: "gravel", label: "Gravel", aliases: ["gravel"] },
  { id: "cicloturismo", label: "Cicloturismo", aliases: ["cicloturismo"] },
];

export const DISCIPLINE_FILTERS = FOOT_DISCIPLINE_FILTERS;

export type DisciplineId = (typeof FOOT_DISCIPLINE_FILTERS)[number]["id"];

const LABELS: Record<string, string> = {
  asfalto: "Asfalto",
  trail: "Trail",
  mixto: "Mixto/Cross",
  media_maraton: "Media maratón",
  nocturna: "Nocturna",
  skyrace: "Skyrace",
  marcha: "Marcha",
  cross: "Cross",
  carretera: "Carretera",
  mtb: "MTB/BTT",
  btt: "MTB/BTT",
  gravel: "Gravel",
  cicloturismo: "Cicloturismo",
  criterium: "Criterium",
  ciclismo: "Ciclismo",
};

const TONES: Record<string, string> = {
  asfalto: "from-sky-800 to-cyan-700",
  trail: "from-emerald-900 to-lime-800",
  mixto: "from-teal-800 to-emerald-700",
  media_maraton: "from-indigo-800 to-blue-700",
  nocturna: "from-slate-900 to-violet-800",
  skyrace: "from-stone-800 to-amber-800",
  carretera: "from-zinc-800 to-sky-700",
  mtb: "from-orange-900 to-amber-700",
  btt: "from-orange-900 to-amber-700",
  gravel: "from-stone-700 to-yellow-800",
  cicloturismo: "from-cyan-900 to-teal-700",
};

const MARKER: Record<string, string> = {
  asfalto: "#0284c7",
  trail: "#15803d",
  mixto: "#0f766e",
  media_maraton: "#3730a3",
  nocturna: "#5b21b6",
  skyrace: "#b45309",
  carretera: "#334155",
  mtb: "#c2410c",
  btt: "#c2410c",
  gravel: "#a16207",
  cicloturismo: "#0e7490",
};

export function disciplineLabel(value: string | null | undefined): string {
  if (!value) return "Carrera";
  return LABELS[value] ?? value.replaceAll("_", " ");
}

export function disciplineTone(value: string | null | undefined): string {
  if (!value) return "from-forest to-atlantic";
  return TONES[value] ?? "from-forest to-atlantic";
}

export function disciplineMarkerColor(value: string | null | undefined): string {
  if (!value) return "#14532d";
  return MARKER[value] ?? "#14532d";
}

export function isKnownDiscipline(value: string | null | undefined): value is DisciplineId {
  return DISCIPLINE_FILTERS.some((item) => item.id === value);
}

export type DisciplineChip = { id: string; label: string };

function presentKeys(events: Evento[]): Set<string> {
  const keys = new Set<string>();
  for (const event of events) {
    if (event.disciplina_normalizada) {
      keys.add(normalizeDisciplineKey(event.disciplina_normalizada));
    }
  }
  return keys;
}

export function cyclingChipsInData(events: Evento[]): DisciplineChip[] {
  const present = presentKeys(events);
  return CYCLING_DISCIPLINE_FILTERS.filter((chip) =>
    chip.aliases.some((alias) => present.has(alias)),
  ).map(({ id, label }) => ({ id, label }));
}

export function visibleDisciplineFilters(
  events: Evento[],
  modalidad: ModalidadFilter = "todas",
): DisciplineChip[] {
  const cycling = cyclingChipsInData(events);
  if (modalidad === "ciclismo") return cycling;
  if (modalidad === "a_pie") return [...FOOT_DISCIPLINE_FILTERS];
  return [...FOOT_DISCIPLINE_FILTERS, ...cycling];
}

export function disciplineMatches(event: Evento, filterId: string): boolean {
  if (!filterId) return true;
  const eventKey = event.disciplina_normalizada
    ? normalizeDisciplineKey(event.disciplina_normalizada)
    : "";
  if (eventKey === filterId) return true;
  const cycling = CYCLING_DISCIPLINE_FILTERS.find((chip) => chip.id === filterId);
  if (cycling) return cycling.aliases.includes(eventKey);
  return false;
}
