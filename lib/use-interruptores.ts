"use client";

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { pedirInterruptores, type Entorno, type Interruptores } from "./interruptores-anuncios";

const CACHE = "av-anuncios";
const CINCO_MIN = 5 * 60 * 1000;
let enCurso: Promise<Interruptores> | null = null;

function entornoNavegador(): Entorno {
  const v = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (v) return v === "production" ? "pro" : "pre";
  return HOSTS_PRO.includes(window.location.hostname) ? "pro" : "pre";
}

const HOSTS_PRO: string[] = ["www.carrerasasturias.es", "carrerasasturias.es"];

function leerCache(entorno: Entorno): Interruptores | null {
  try {
    const c = JSON.parse(window.sessionStorage.getItem(CACHE) || "null");
    if (c && c.entorno === entorno && Date.now() - c.t < CINCO_MIN) return c.estado as Interruptores;
  } catch {}
  return null;
}

export function cargarInterruptores(): Promise<Interruptores> {
  const entorno = entornoNavegador();
  const c = leerCache(entorno);
  if (c) return Promise.resolve(c);
  if (!enCurso) {
    enCurso = pedirInterruptores(entorno).then((estado) => {
      try {
        window.sessionStorage.setItem(CACHE, JSON.stringify({ entorno, t: Date.now(), estado }));
      } catch {}
      return estado;
    });
  }
  return enCurso;
}

const Contexto = createContext<Interruptores | null>(null);

/** El layout lee el estado en el servidor y lo pasa aquí: el HTML ya sale con o sin bloque (sin hueco ni CLS). */
export function InterruptoresProvider({ valor, children }: { valor: Interruptores; children: ReactNode }) {
  return createElement(Contexto.Provider, { value: valor }, children);
}

/** Estado del servidor si hay proveedor; si no, null mientras carga y los componentes no pintan nada. */
export function useInterruptores(): Interruptores | null {
  const delServidor = useContext(Contexto);
  const [estado, setEstado] = useState<Interruptores | null>(delServidor);
  useEffect(() => {
    if (delServidor) return;
    let vivo = true;
    void cargarInterruptores().then((e) => {
      if (vivo) setEstado(e);
    });
    return () => {
      vivo = false;
    };
  }, [delServidor]);
  return delServidor ?? estado;
}
