import type { Metadata } from "next";
import { RegistroAlertas } from "@/components/registro-alertas";

export const metadata: Metadata = {
  title: "Crear una cuenta",
  robots: { index: false, follow: false },
  description: "Cuenta de Carreras Asturias para avisos por correo, Telegram y el móvil.",
};

export default function RegistroPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Registro</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Crear una cuenta</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        Tu cuenta y cómo te avisamos de las carreras. Te enviaremos un mensaje para confirmar tu correo.
      </p>
      <RegistroAlertas />
    </section>
  );
}
