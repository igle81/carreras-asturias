/**
 * Interruptores de anuncios y afiliados (orden de Javier, 25-10-2026).
 * Estado central en Supabase (fdpzepqhkdyfnorremce, tabla public.anuncios_interruptores,
 * lectura pública, escritura solo admin desde el Cuadro de Mandos).
 * Si la lectura falla: Decathlon y Amazon apagados, AdSense encendido.
 * Ver ANUNCIOS.md.
 */
export type Interruptores = { decathlon: boolean; amazon: boolean; adsense: boolean };
export type Entorno = "pre" | "pro";

export const RESPALDO: Interruptores = Object.freeze({ decathlon: false, amazon: false, adsense: true });
export const INTERRUPTORES_URL =
  "https://fdpzepqhkdyfnorremce.supabase.co/rest/v1/anuncios_interruptores?select=decathlon,amazon,adsense&entorno=eq.";
/** Clave publicable (pública por diseño; la tabla solo se puede leer con ella). */
export const INTERRUPTORES_CLAVE = "sb_publishable_yTb9Y3Ogs-O7egguYqOWIA_B_mB5gGI";
export const TIEMPO_MAXIMO_MS = 3000;

export function normalizarInterruptores(datos: unknown): Interruptores {
  const fila = Array.isArray(datos) ? datos[0] : datos;
  if (!fila || typeof fila !== "object") return { ...RESPALDO };
  const f = fila as Record<string, unknown>;
  const b = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  return {
    decathlon: b(f.decathlon, RESPALDO.decathlon),
    amazon: b(f.amazon, RESPALDO.amazon),
    adsense: b(f.adsense, RESPALDO.adsense),
  };
}

export async function pedirInterruptores(
  entorno: Entorno,
  opciones: { fetchImpl?: typeof fetch; init?: Record<string, unknown> } = {},
): Promise<Interruptores> {
  const f = opciones.fetchImpl ?? fetch;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIEMPO_MAXIMO_MS);
  try {
    const r = await f(INTERRUPTORES_URL + entorno, {
      ...(opciones.init ?? {}),
      headers: { apikey: INTERRUPTORES_CLAVE, accept: "application/json" },
      signal: ctl.signal,
    } as RequestInit);
    if (!r.ok) return { ...RESPALDO };
    return normalizarInterruptores(await r.json());
  } catch {
    return { ...RESPALDO };
  } finally {
    clearTimeout(t);
  }
}

/** Servidor: producción de Vercel lee la fila «pro»; todo lo demás, «pre». Revalida cada minuto. */
export function entornoServidor(): Entorno {
  return process.env.VERCEL_ENV === "production" ? "pro" : "pre";
}

export async function leerInterruptores(): Promise<Interruptores> {
  return pedirInterruptores(entornoServidor(), { init: { next: { revalidate: 60 } } });
}

/** Quita de un texto legal las frases de los proveedores apagados. */
const PATRONES: Record<keyof Interruptores, RegExp> = {
  decathlon: /Decathlon|Awin|awin1/,
  amazon: /Amazon(?!\s*Web Services|aws)/,
  adsense: /AdSense/,
};

export function frasePermitida(texto: string, i: Interruptores): boolean {
  return (Object.keys(PATRONES) as (keyof Interruptores)[]).every((k) => i[k] || !PATRONES[k].test(texto));
}
