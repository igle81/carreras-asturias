"use client";

import { abrirConfiguracionCookies } from "@/lib/consentimiento-cookies";

export function ConfigurarCookies({
  className = "text-sm font-semibold text-forest underline underline-offset-2",
}: {
  className?: string;
}) {
  return (
    <button type="button" onClick={abrirConfiguracionCookies} className={className}>
      Configurar cookies
    </button>
  );
}
