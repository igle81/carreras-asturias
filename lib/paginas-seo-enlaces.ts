import type { Evento } from "@/lib/types";
import { mesActualOSiguiente, mesPath, mesTitulo } from "@/lib/paginas-seo";

/** Enlaces fijos a las páginas SEO (pie y relacionados). */
export function enlacesSeo(events: Evento[], from = new Date()) {
  const mes = mesActualOSiguiente(events, from);
  return [
    { href: "/este-fin-de-semana", label: "Carreras este fin de semana" },
    ...(mes ? [{ href: mesPath(mes), label: `Carreras en ${mesTitulo(mes)}` }] : []),
    { href: "/trail", label: "Trail en Asturias" },
    { href: "/calendario/meses", label: "Calendario por meses" },
    { href: "/concejo", label: "Carreras por concejo" },
  ];
}

/** Pie: sin consultas (va en todas las páginas). */
export const ENLACES_SEO_FIJOS = [
  { href: "/este-fin-de-semana", label: "Carreras este fin de semana" },
  { href: "/calendario/meses", label: "Calendario por meses" },
  { href: "/trail", label: "Trail en Asturias" },
  { href: "/concejo", label: "Carreras por concejo" },
] as const;
