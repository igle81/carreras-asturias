export const DISCIPLINE_FILTERS = [
  { id: "asfalto", label: "Asfalto" },
  { id: "trail", label: "Trail" },
  { id: "mixto", label: "Mixto/Cross" },
  { id: "media_maraton", label: "Media maratón" },
  { id: "nocturna", label: "Nocturna" },
  { id: "skyrace", label: "Skyrace" },
] as const;

export type DisciplineId = (typeof DISCIPLINE_FILTERS)[number]["id"];

const LABELS: Record<string, string> = {
  asfalto: "Asfalto",
  trail: "Trail",
  mixto: "Mixto/Cross",
  media_maraton: "Media maratón",
  nocturna: "Nocturna",
  skyrace: "Skyrace",
};

const TONES: Record<string, string> = {
  asfalto: "from-sky-800 to-cyan-700",
  trail: "from-emerald-900 to-lime-800",
  mixto: "from-teal-800 to-emerald-700",
  media_maraton: "from-indigo-800 to-blue-700",
  nocturna: "from-slate-900 to-violet-800",
  skyrace: "from-stone-800 to-amber-800",
};

const MARKER: Record<string, string> = {
  asfalto: "#0284c7",
  trail: "#15803d",
  mixto: "#0f766e",
  media_maraton: "#3730a3",
  nocturna: "#5b21b6",
  skyrace: "#b45309",
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
