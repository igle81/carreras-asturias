/**
 * Filtros de avisos de Mis avisos (19-10-2026). Se guardan en carreras.suscripciones_alertas.filtros_avisos.
 * El envío lo filtra Supabase (carreras.avisos_destinatarios_filtrados, migración 20261018223301), que usa n8n.
 * Aquí: opciones a partir de los eventos reales, limpieza antes de guardar y la misma regla para los tests.
 * Sin filtros ({}) se recibe todo. Si a una carrera le falta el dato, el aviso llega igual.
 */
import { disciplineLabel } from "./disciplines";
import { uniqueConcejos } from "./geo";
import type { Evento } from "./types";

export type FiltrosAvisos = {
  deporte?: string[];
  modalidad?: string[];
  concejo?: string[];
  tipo?: string[];
  distancia?: string[];
};

export const CLAVES_FILTRO = ["deporte", "modalidad", "concejo", "tipo", "distancia"] as const;
export type ClaveFiltro = (typeof CLAVES_FILTRO)[number];

export const DEPORTES = [
  { id: "pie", label: "A pie" },
  { id: "ciclismo", label: "Ciclismo" },
] as const;

export const TIPOS_AVISO = [
  { id: "apertura", label: "Apertura de inscripciones" },
  { id: "clasificaciones", label: "Clasificaciones" },
] as const;

/** Rangos según las distancias reales a pie (mediana ≈ 11,6 km; el 75 % hasta 21 km). Solo carreras a pie. */
export const DISTANCIAS = [
  { id: "corta", label: "Hasta 10 km", min: 0, max: 10, incluyeMax: false },
  { id: "media", label: "De 10 a 21 km", min: 10, max: 21.1, incluyeMax: true },
  { id: "larga", label: "Más de 21 km", min: 21.1, max: Infinity, incluyeMax: false },
] as const;

export type OpcionFiltro = { id: string; label: string; valores: string[] };

export type OpcionesFiltros = {
  deporte: OpcionFiltro[];
  modalidad: { deporte: string; opciones: OpcionFiltro[] }[];
  concejo: OpcionFiltro[];
  tipo: OpcionFiltro[];
  distancia: OpcionFiltro[];
};

const MAX_VALORES = 60;

/** Opciones que se enseñan: solo deportes, modalidades y concejos que existen en los eventos. */
export function opcionesFiltros(eventos: Pick<Evento, "modalidad" | "disciplina_normalizada" | "municipio">[]): OpcionesFiltros {
  const presentes = new Set(eventos.map((e) => e.modalidad).filter(Boolean) as string[]);
  const deporte = DEPORTES.filter((d) => presentes.has(d.id)).map((d) => ({ id: d.id, label: d.label, valores: [d.id] }));
  const modalidad = deporte.map((d) => {
    const porEtiqueta = new Map<string, Set<string>>();
    for (const e of eventos) {
      if (e.modalidad !== d.id || !e.disciplina_normalizada) continue;
      const label = disciplineLabel(e.disciplina_normalizada);
      const set = porEtiqueta.get(label) ?? new Set<string>();
      set.add(e.disciplina_normalizada);
      porEtiqueta.set(label, set);
    }
    const opciones = [...porEtiqueta.entries()]
      .map(([label, set]) => {
        const valores = [...set].sort();
        return { id: valores.join("+"), label, valores };
      })
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
    return { deporte: d.id, opciones };
  });
  const concejo = uniqueConcejos(eventos as Evento[]).map((c) => ({ id: c, label: c, valores: [c] }));
  return {
    deporte,
    modalidad,
    concejo,
    tipo: TIPOS_AVISO.map((t) => ({ id: t.id, label: t.label, valores: [t.id] })),
    distancia: DISTANCIAS.map((t) => ({ id: t.id, label: t.label, valores: [t.id] })),
  };
}

const PERMITIDOS: Partial<Record<ClaveFiltro, readonly string[]>> = {
  deporte: DEPORTES.map((d) => d.id),
  tipo: TIPOS_AVISO.map((t) => t.id),
  distancia: DISTANCIAS.map((d) => d.id),
};

/** Deja solo claves y valores válidos (igual que carreras.filtros_avisos_validos) y quita listas vacías. */
export function normalizarFiltros(entrada: unknown): FiltrosAvisos {
  const out: FiltrosAvisos = {};
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return out;
  for (const clave of CLAVES_FILTRO) {
    const bruto = (entrada as Record<string, unknown>)[clave];
    if (!Array.isArray(bruto)) continue;
    const valores = [
      ...new Set(
        bruto
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim())
          .filter((v) => v.length >= 1 && v.length <= 80)
          .filter((v) => (clave === "modalidad" ? /^[a-z_]{2,40}$/.test(v) : true))
          .filter((v) => !PERMITIDOS[clave] || PERMITIDOS[clave]!.includes(v)),
      ),
    ].slice(0, MAX_VALORES);
    if (valores.length) out[clave] = valores;
  }
  return out;
}

export function sinFiltros(f: FiltrosAvisos): boolean {
  return CLAVES_FILTRO.every((c) => !f[c]?.length);
}

export function tipoDeAviso(tipo: string): "apertura" | "clasificaciones" | null {
  if (tipo === "vispera" || tipo === "dia") return "apertura";
  if (tipo.startsWith("clasif")) return "clasificaciones";
  return null;
}

export function kmsDeEvento(distancias: unknown): number[] {
  const lista = Array.isArray(distancias) ? distancias : typeof distancias === "string" ? [distancias] : [];
  const kms: number[] = [];
  for (const d of lista) {
    if (d && typeof d === "object" && typeof (d as { km?: unknown }).km === "number") kms.push((d as { km: number }).km);
    else if (typeof d === "string") {
      const m = d.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(k|km)$/i);
      if (m) kms.push(Number(m[1].replace(",", ".")));
    }
  }
  return kms.filter((k) => Number.isFinite(k) && k > 0);
}

/** Misma regla que carreras.avisos_evento_pasa_filtros (la del envío). */
export function avisoPasaFiltros(
  f: FiltrosAvisos,
  tipo: string,
  evento: Pick<Evento, "modalidad" | "disciplina_normalizada" | "municipio" | "municipio_meta"> & { distancias?: unknown } | null,
): boolean {
  if (sinFiltros(f) || tipo === "prueba") return true;
  const t = tipoDeAviso(tipo);
  if (f.tipo?.length && t && !f.tipo.includes(t)) return false;
  if (!evento) return true;
  if (f.deporte?.length && evento.modalidad && !f.deporte.includes(evento.modalidad)) return false;
  if (f.modalidad?.length && evento.disciplina_normalizada && !f.modalidad.includes(evento.disciplina_normalizada)) return false;
  if (f.concejo?.length && (evento.municipio || evento.municipio_meta)) {
    const lista = f.concejo.map((c) => c.trim().toLocaleLowerCase("es"));
    const valores = [evento.municipio, evento.municipio_meta].map((v) => (v ?? "").trim().toLocaleLowerCase("es"));
    if (!valores.some((v) => v && lista.includes(v))) return false;
  }
  if (f.distancia?.length && evento.modalidad !== "ciclismo") {
    const kms = kmsDeEvento(evento.distancias);
    if (kms.length) {
      const ok = kms.some((k) =>
        DISTANCIAS.some(
          (r) => f.distancia!.includes(r.id) && k >= r.min && (r.incluyeMax ? k <= r.max : k < r.max) && (r.id !== "larga" || k > r.min),
        ),
      );
      if (!ok) return false;
    }
  }
  return true;
}

/** Frase corta del estado de los filtros para la tarjeta. */
export function resumenFiltros(f: FiltrosAvisos): string {
  if (sinFiltros(f)) return "Recibes todos los avisos.";
  const partes: string[] = [];
  if (f.deporte?.length) partes.push(f.deporte.map((d) => DEPORTES.find((x) => x.id === d)?.label ?? d).join(" y ").toLocaleLowerCase("es"));
  if (f.modalidad?.length) partes.push(`${f.modalidad.length} ${f.modalidad.length === 1 ? "modalidad" : "modalidades"}`);
  if (f.concejo?.length) partes.push(f.concejo.length === 1 ? `en ${f.concejo[0]}` : `en ${f.concejo.length} concejos`);
  if (f.tipo?.length === 1) partes.push(f.tipo[0] === "apertura" ? "solo aperturas" : "solo clasificaciones");
  if (f.distancia?.length) partes.push(f.distancia.map((d) => DISTANCIAS.find((x) => x.id === d)?.label.toLocaleLowerCase("es") ?? d).join(", "));
  return `Solo te llegan avisos de: ${partes.join(" · ")}.`;
}

/** Marca o desmarca un grupo de valores (una opción puede agrupar varios valores, p. ej. mtb+btt). */
export function alternarValores(f: FiltrosAvisos, clave: ClaveFiltro, valores: string[], marcar: boolean): FiltrosAvisos {
  const actual = new Set(f[clave] ?? []);
  for (const v of valores) {
    if (marcar) actual.add(v);
    else actual.delete(v);
  }
  return normalizarFiltros({ ...f, [clave]: [...actual] });
}
