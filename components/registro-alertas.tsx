"use client";

import { FormEvent, useId, useState } from "react";
import { emailRegistroValido, urlConfirmarAlertas } from "@/lib/registro-alertas";
import { getSupabase } from "@/lib/supabase";

type Estado = "listo" | "enviando" | "enviado" | "error";

export function RegistroAlertas() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("listo");
  const [mensaje, setMensaje] = useState("");
  const campoId = useId();
  const ayudaId = useId();

  async function alEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (estado === "enviando") return;
    const limpio = emailRegistroValido(email);
    if (!limpio) {
      setEstado("error");
      setMensaje("Escribe un correo válido.");
      return;
    }

    setEstado("enviando");
    setMensaje("");
    const { error } = await getSupabase().auth.signInWithOtp({
      email: limpio,
      options: {
        emailRedirectTo: urlConfirmarAlertas(window.location.origin),
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error(error);
      setEstado("error");
      const texto = error.message.toLowerCase();
      setMensaje(
        texto.includes("redirect") || texto.includes("not allowed")
          ? "Este sitio todavía no puede enviar el enlace. Inténtalo más tarde."
          : "No se ha podido enviar el enlace. Inténtalo de nuevo en unos minutos.",
      );
      return;
    }

    setEstado("enviado");
    setMensaje("Revisa tu correo y abre el enlace en este mismo navegador.");
  }

  return (
    <form onSubmit={(event) => void alEnviar(event)} className="flex min-w-0 flex-wrap items-center gap-2">
      <label htmlFor={campoId} className="sr-only">
        Correo para los avisos
      </label>
      <input
        id={campoId}
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        disabled={estado === "enviando" || estado === "enviado"}
        onChange={(event) => {
          setEmail(event.target.value);
          if (estado === "error") setEstado("listo");
        }}
        placeholder="Tu correo"
        aria-describedby={ayudaId}
        className="w-44 max-w-full rounded-full border border-forest/15 bg-white px-3 py-1.5 text-xs text-ink outline-none placeholder:text-ink/40 focus:border-atlantic/50 disabled:opacity-70"
      />
      <button
        type="submit"
        disabled={estado === "enviando" || estado === "enviado"}
        className="inline-flex items-center justify-center rounded-full border border-forest/15 bg-forest px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-pine disabled:cursor-default disabled:opacity-90"
      >
        {estado === "enviando" ? "Enviando…" : estado === "enviado" ? "Enlace enviado" : "Avisos por correo"}
      </button>
      <p id={ayudaId} className={`text-[11px] leading-snug ${estado === "error" ? "text-fire" : "text-ink/55"}`}>
        {mensaje || "Te escribimos cuando abra una inscripción. El enlace hay que abrirlo aquí."}
      </p>
    </form>
  );
}
