import type { Metadata } from "next";
import { VipPushTest } from "@/components/vip-push-test";

export const metadata: Metadata = {
  title: { absolute: "Interno · VIP push" },
  description: "Página interna de prueba de OneSignal. No indexar.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function InternoVipPushPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="inline-flex rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-forest">
        Solo uso interno
      </p>
      <h1 className="mt-4 font-display text-4xl font-black text-ink">Interno · VIP push</h1>
      <p className="mt-4 text-lg text-ink/70">
        Prueba de OneSignal para optar este navegador a avisos VIP. No aparece en
        el menú, el pie ni el mapa del sitio.
      </p>
      <VipPushTest />
    </article>
  );
}
