"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Estado = "comprobando" | "listo" | "ya" | "error";

type Respuesta = {
  ok?: boolean;
  nueva?: boolean;
  error?: string;
};

export function ConfirmarAlertas() {
  const [estado, setEstado] = useState<Estado>("comprobando");

  useEffect(() => {
    let cancelado = false;

    async function confirmar() {
      const supabase = getSupabase();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "email" | "magiclink",
        });
        if (error) {
          if (!cancelado) setEstado("error");
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelado) setEstado("error");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        if (!cancelado) setEstado("error");
        return;
      }

      const response = await fetch("/api/alertas/suscribir", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const body = (await response.json().catch(() => ({}))) as Respuesta;
      if (cancelado) return;
      if (!response.ok || !body.ok) {
        setEstado("error");
        return;
      }
      setEstado(body.nueva ? "listo" : "ya");
    }

    void confirmar().catch(() => {
      if (!cancelado) setEstado("error");
    });

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Avisos por correo</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">
        {estado === "listo"
          ? "Ya estás apuntado"
          : estado === "ya"
            ? "Este correo ya estaba apuntado"
            : estado === "error"
              ? "No se ha podido confirmar"
              : "Confirmando el enlace…"}
      </h1>
      <p className="mt-3 text-sm text-ink/70">
        {estado === "error"
          ? "Abre el enlace en el mismo navegador donde pediste los avisos, o pide otro desde la cabecera."
          : estado === "comprobando"
            ? "Estamos guardando tu correo."
            : "Te avisaremos a este correo cuando haya una inscripción que encaje."}
      </p>
    </section>
  );
}
