import type { Punto } from "./tipos";

const DIA = /^(\d{4})-(\d{2})-(\d{2})/;

/** Devuelve el día AAAA-MM-DD de una fecha ISO válida, o `null`. */
export function diaIso(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const m = DIA.exec(valor.trim());
  if (!m) return null;
  const [, a, me, d] = m;
  const f = new Date(Date.UTC(Number(a), Number(me) - 1, Number(d)));
  if (f.getUTCFullYear() !== Number(a) || f.getUTCMonth() !== Number(me) - 1 || f.getUTCDate() !== Number(d)) return null;
  return `${a}-${me}-${d}`;
}

/** Número finito desde un número o un texto numérico («43.36»). Vacío, `null` o texto no numérico → `null`. */
function numero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor === "string" && valor.trim() !== "") {
    const n = Number(valor.trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Solo se enlazan direcciones http(s) o una ruta interna del sitio (`/evento/…`).
 * Se descartan `javascript:`, `//…` y cualquier otra forma que no sea un enlace de verdad.
 */
export function enlaceSeguro(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.trim() === "") return null;
  const texto = valor.trim();
  if (texto.startsWith("/") && !texto.startsWith("//") && !texto.includes("\\") && !texto.includes("//")) {
    return /^\/[A-Za-z0-9._~/-]+$/.test(texto) ? texto : null;
  }
  try {
    const u = new URL(texto);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const texto = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

export type ResultadoValidacion = { validos: Punto[]; descartados: number };

/**
 * Valida la lista de entrada. Se ignora (y se cuenta como descartado) todo lo que no sea un objeto
 * con latitud y longitud válidas (−90…90 y −180…180). El nombre, la categoría y la fecha son opcionales:
 * sin nombre → «Sin nombre»; sin categoría → «sin-categoria»; fecha no válida → sin fecha.
 */
export function validarPuntos(entrada: unknown, sinNombre = "Sin nombre", sinCategoria = "sin-categoria"): ResultadoValidacion {
  if (!Array.isArray(entrada)) return { validos: [], descartados: 0 };
  const validos: Punto[] = [];
  let descartados = 0;
  for (const bruto of entrada) {
    if (!bruto || typeof bruto !== "object") {
      descartados++;
      continue;
    }
    const p = bruto as Record<string, unknown>;
    const lat = numero(p.lat);
    const lon = numero(p.lon ?? p.lng);
    if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      descartados++;
      continue;
    }
    validos.push({
      nombre: texto(p.nombre) ?? sinNombre,
      lat,
      lon,
      categoria: texto(p.categoria) ?? sinCategoria,
      fecha: diaIso(p.fecha),
      enlace: enlaceSeguro(p.enlace),
      lugar: texto(p.lugar),
    });
  }
  return { validos, descartados };
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** «vie 4 jun» (con el año si no es el actual). Sin dependencias del navegador: no cambia con la zona horaria. */
export function textoFecha(dia: string, anioActual = new Date().getFullYear()): string {
  const [a, m, d] = dia.split("-").map(Number);
  const semana = DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
  return `${semana} ${d} ${MESES[m - 1]}${a === anioActual ? "" : ` ${a}`}`;
}

/** Enlace «Cómo llegar» a Google Maps (indicaciones en coche). No lleva clave. */
export function enlaceComoLlegar(destino: { lat: number; lon: number }, origen?: { lat: number; lon: number } | string | null): string {
  const p = new URLSearchParams({ api: "1" });
  if (typeof origen === "string" && origen.trim()) p.set("origin", origen.trim().slice(0, 200));
  else if (origen && typeof origen === "object") p.set("origin", `${origen.lat.toFixed(5)},${origen.lon.toFixed(5)}`);
  p.set("destination", `${destino.lat.toFixed(5)},${destino.lon.toFixed(5)}`);
  p.set("travelmode", "driving");
  return `https://www.google.com/maps/dir/?${p.toString()}`;
}
