import type { Metadata } from "next";
import { MisAvisos } from "@/components/mis-avisos";
import { getEventos } from "@/lib/events";
import { opcionesFiltros } from "@/lib/filtros-avisos";

export const metadata: Metadata = {
  title: "Mis avisos",
  robots: { index: false, follow: false },
};

export default async function AvisosPage() {
  // Opciones de filtros a partir de los eventos reales (modalidad, disciplina y concejo).
  const opciones = opcionesFiltros(await getEventos());
  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Cuenta</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Mis avisos</h1>
      <p className="mt-3 text-sm text-ink/70">Correo, Telegram, el aviso en este móvil y qué avisos quieres.</p>
      <MisAvisos opciones={opciones} />
    </section>
  );
}
