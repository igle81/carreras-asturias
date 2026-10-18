"use client";

import { useEffect, useState } from "react";
import {
  alternarValores,
  normalizarFiltros,
  resumenFiltros,
  sinFiltros,
  type ClaveFiltro,
  type FiltrosAvisos,
  type OpcionFiltro,
  type OpcionesFiltros,
} from "@/lib/filtros-avisos";
import { getSupabase } from "@/lib/supabase";

type Props = { opciones: OpcionesFiltros };

/** Tarjeta «Qué avisos quieres» de Mis avisos. Guarda en suscripciones_alertas.filtros_avisos (solo la propia fila). */
export function FiltrosAvisosCard({ opciones }: Props) {
  const [filtros, setFiltros] = useState<FiltrosAvisos>({});
  const [guardados, setGuardados] = useState<FiltrosAvisos>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "guardando">("cargando");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const { data } = await getSupabase().auth.getSession();
      const id = data.session?.user.id ?? null;
      if (!id) return;
      const { data: fila } = await getSupabase()
        .schema("carreras")
        .from("suscripciones_alertas")
        .select("filtros_avisos")
        .eq("user_id", id)
        .maybeSingle();
      if (cancelado) return;
      const f = normalizarFiltros((fila as { filtros_avisos?: unknown } | null)?.filtros_avisos);
      setUserId(id);
      setFiltros(f);
      setGuardados(f);
      setEstado("listo");
    })().catch(() => {
      if (!cancelado) setError("No se han podido cargar tus filtros.");
    });
    return () => {
      cancelado = true;
    };
  }, []);

  if (estado === "cargando" && !error) return null;

  const cambiado = JSON.stringify(normalizarFiltros(filtros)) !== JSON.stringify(normalizarFiltros(guardados));

  function marcado(clave: ClaveFiltro, o: OpcionFiltro) {
    return o.valores.every((v) => filtros[clave]?.includes(v));
  }

  function grupo(clave: ClaveFiltro, titulo: string, lista: OpcionFiltro[], nota?: string) {
    if (!lista.length) return null;
    return (
      <fieldset className="mt-3">
        <legend className="text-xs font-semibold text-ink">{titulo}</legend>
        {nota ? <p className="text-xs text-ink/70">{nota}</p> : null}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {lista.map((o) => (
            <label key={o.id} className="inline-flex items-center gap-1.5 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={marcado(clave, o)}
                onChange={(e) => setFiltros((f) => alternarValores(f, clave, o.valores, e.target.checked))}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  async function guardar() {
    if (!userId) return;
    setEstado("guardando");
    setError("");
    setMensaje("");
    const limpio = normalizarFiltros(filtros);
    const { error: e } = await getSupabase()
      .schema("carreras")
      .from("suscripciones_alertas")
      .update({ filtros_avisos: limpio, actualizado_en: new Date().toISOString() })
      .eq("user_id", userId);
    setEstado("listo");
    if (e) {
      setError("No se han podido guardar tus filtros. Entra de nuevo e inténtalo.");
      return;
    }
    setFiltros(limpio);
    setGuardados(limpio);
    setMensaje(sinFiltros(limpio) ? "Guardado. Recibes todos los avisos." : "Guardado. Solo te llegarán los avisos que has marcado.");
  }

  return (
    <section className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-4 text-sm">
      <h2 className="font-display text-lg font-bold text-ink">Qué avisos quieres</h2>
      <p className="mt-1 text-ink/70">{resumenFiltros(guardados)}</p>
      <p className="mt-1 text-xs text-ink/70">
        Si no marcas nada en un grupo, te llega todo lo de ese grupo. Si a una carrera le falta ese dato, el aviso te llega igual.
        Vale para el correo, Telegram y las notificaciones.
      </p>
      {grupo("tipo", "Tipo de aviso", opciones.tipo)}
      {grupo("deporte", "A pie o ciclismo", opciones.deporte)}
      {opciones.modalidad.map((m) =>
        grupo(
          "modalidad",
          `Modalidad (${opciones.deporte.find((d) => d.id === m.deporte)?.label.toLocaleLowerCase("es") ?? m.deporte})`,
          m.opciones,
        ),
      )}
      {grupo("distancia", "Distancia", opciones.distancia, "Solo carreras a pie.")}
      {opciones.concejo.length ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink">
            Concejo{filtros.concejo?.length ? ` (${filtros.concejo.length})` : ""}
          </summary>
          {grupo("concejo", "Concejos con carreras en el calendario", opciones.concejo)}
        </details>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!cambiado || estado === "guardando"}
          onClick={() => void guardar()}
          className="inline-flex rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Guardar filtros
        </button>
        {!sinFiltros(filtros) ? (
          <button type="button" onClick={() => setFiltros({})} className="text-xs font-semibold text-forest underline-offset-2 hover:underline">
            Quitar filtros (recibir todo)
          </button>
        ) : null}
      </div>
      {mensaje ? <p className="mt-2 text-xs text-forest" role="status">{mensaje}</p> : null}
      {error ? <p className="mt-2 text-xs text-fire" role="alert">{error}</p> : null}
    </section>
  );
}
