import type { Metadata } from "next";
import { ConfirmarAlertas } from "@/components/confirmar-alertas";

export const metadata: Metadata = {
  title: "Confirmar avisos",
  robots: { index: false, follow: false },
};

export default function ConfirmarAlertasPage() {
  return <ConfirmarAlertas />;
}
