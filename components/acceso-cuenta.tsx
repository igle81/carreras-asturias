"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { emailRegistroValido, RUTA_AVISOS, RUTA_REGISTRO } from "@/lib/registro-alertas";
import { getSupabase } from "@/lib/supabase";

const CAMPO =
  "mt-1.5 w-full rounded-2xl border border-forest/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-atlantic/50";

export function AccesoCuenta() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limpio = emailRegistroValido(correo);
    if (!limpio || password.length < 8) {
      setMensaje("Revisa el correo y la contraseña.");
      return;
    }
    setEnviando(true);
    setMensaje("");
    const { error } = await getSupabase().auth.signInWithPassword({ email: limpio, password });
    if (error) {
      setEnviando(false);
      const texto = error.message.toLowerCase();
      setMensaje(
        texto.includes("confirm")
          ? "Confirma tu correo antes de entrar. Revisa la bandeja."
          : "No se ha podido entrar. Revisa el correo y la contraseña.",
      );
      return;
    }
    window.location.href = RUTA_AVISOS;
  }

  return (
    <form onSubmit={(event) => void alEnviar(event)} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-ink">
        Correo electrónico
        <input
          type="email"
          name="correo"
          autoComplete="email"
          required
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          className={CAMPO}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Contraseña
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={CAMPO}
        />
      </label>
      {mensaje ? (
        <p className="text-sm text-fire" role="alert">
          {mensaje}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex items-center justify-center rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href={RUTA_REGISTRO} className="font-semibold text-forest underline-offset-2 hover:underline">
          Crear una cuenta
        </Link>
      </p>
    </form>
  );
}
