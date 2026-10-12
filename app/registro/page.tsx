import type { Metadata } from "next";
import { RegistroAlertas } from "@/components/registro-alertas";

export const metadata: Metadata = {
  title: "Avisos por correo",
  description:
    "Nombre, correo e Instagram opcional para los avisos de Carreras Asturias. El enlace de confirmación llega al correo.",
};

export default function RegistroPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Registro</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Avisos por correo</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        Deja tu nombre y tu correo. Instagram es opcional. No hay contraseña: llega un enlace y hay que abrirlo en
        este mismo navegador. Si marcas los avisos del navegador, se vinculan a tu cuenta al confirmar.
      </p>
      <RegistroAlertas />
    </section>
  );
}
