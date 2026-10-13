import type { Metadata } from "next";
import { AccesoCuenta } from "@/components/acceso-cuenta";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default function AccesoPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Cuenta</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Mis avisos</h1>
      <p className="mt-3 text-sm text-ink/70">Introduce tu correo y tu contraseña para entrar.</p>
      <AccesoCuenta />
    </section>
  );
}
