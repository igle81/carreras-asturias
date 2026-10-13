import type { Metadata } from "next";
import { MisAvisos } from "@/components/mis-avisos";

export const metadata: Metadata = {
  title: "Mis avisos",
  robots: { index: false, follow: false },
};

export default function AvisosPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Cuenta</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Mis avisos</h1>
      <p className="mt-3 text-sm text-ink/70">Correo, Telegram y el aviso en este móvil.</p>
      <MisAvisos />
    </section>
  );
}
