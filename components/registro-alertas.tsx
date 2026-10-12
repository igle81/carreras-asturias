"use client";

import { FormEvent, useId, useState } from "react";
import {
  emailRegistroValido,
  guardarRegistroPendiente,
  instagramRegistro,
  nombreRegistroValido,
  urlConfirmarAlertas,
} from "@/lib/registro-alertas";
import { mensajeErrorAvisos, prepararPushRegistro } from "@/lib/onesignal-web";
import { getSupabase } from "@/lib/supabase";

type Estado = "listo" | "enviando" | "enviado" | "error";

const CAMPO =
  "w-full rounded-2xl border border-forest/15 bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-atlantic/50 disabled:opacity-70";

export function RegistroAlertas() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [push, setPush] = useState(false);
  const [estado, setEstado] = useState<Estado>("listo");
  const [mensaje, setMensaje] = useState("");
  const nombreId = useId();
  const emailId = useId();
  const instagramId = useId();
  const pushId = useId();
  const ayudaId = useId();
  const bloqueado = estado === "enviando" || estado === "enviado";

  function limpiarError() {
    if (estado === "error") setEstado("listo");
  }

  async function alEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (estado === "enviando") return;
    const nombreLimpio = nombreRegistroValido(nombre);
    if (!nombreLimpio) {
      setEstado("error");
      setMensaje("Escribe tu nombre.");
      return;
    }
    const correo = emailRegistroValido(email);
    if (!correo) {
      setEstado("error");
      setMensaje("Escribe un correo válido.");
      return;
    }
    const red = instagramRegistro(instagram);
    if (!red.ok) {
      setEstado("error");
      setMensaje("El usuario de Instagram no es válido. Usa un @usuario.");
      return;
    }

    setEstado("enviando");
    setMensaje("");

    let pushConcedido = false;
    if (push) {
      try {
        await prepararPushRegistro();
        pushConcedido = true;
      } catch (error) {
        console.error(error);
        setEstado("error");
        setMensaje(mensajeErrorAvisos(error));
        return;
      }
    }

    guardarRegistroPendiente({
      nombre: nombreLimpio,
      instagram: red.instagram,
      push: pushConcedido,
    });

    const { error } = await getSupabase().auth.signInWithOtp({
      email: correo,
      options: {
        emailRedirectTo: urlConfirmarAlertas(window.location.origin),
        shouldCreateUser: true,
        data: {
          nombre: nombreLimpio,
          instagram: red.instagram ?? "",
          push_activado: pushConcedido,
        },
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
    <form onSubmit={(event) => void alEnviar(event)} className="mt-6 space-y-4">
      <div>
        <label htmlFor={nombreId} className="block text-sm font-medium text-ink">
          Nombre
        </label>
        <input
          id={nombreId}
          name="nombre"
          autoComplete="name"
          required
          value={nombre}
          disabled={bloqueado}
          onChange={(event) => {
            setNombre(event.target.value);
            limpiarError();
          }}
          className={`mt-1.5 ${CAMPO}`}
        />
      </div>
      <div>
        <label htmlFor={emailId} className="block text-sm font-medium text-ink">
          Correo
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          disabled={bloqueado}
          onChange={(event) => {
            setEmail(event.target.value);
            limpiarError();
          }}
          placeholder="tu@correo.es"
          aria-describedby={ayudaId}
          className={`mt-1.5 ${CAMPO}`}
        />
      </div>
      <div>
        <label htmlFor={instagramId} className="block text-sm font-medium text-ink">
          Instagram <span className="font-normal text-ink/50">(opcional)</span>
        </label>
        <input
          id={instagramId}
          name="instagram"
          autoComplete="off"
          value={instagram}
          disabled={bloqueado}
          onChange={(event) => {
            setInstagram(event.target.value);
            limpiarError();
          }}
          placeholder="@usuario"
          className={`mt-1.5 ${CAMPO}`}
        />
      </div>
      <label htmlFor={pushId} className="flex items-start gap-3 rounded-2xl border border-forest/10 bg-white/70 px-4 py-3">
        <input
          id={pushId}
          type="checkbox"
          name="push"
          checked={push}
          disabled={bloqueado}
          onChange={(event) => {
            setPush(event.target.checked);
            limpiarError();
          }}
          className="mt-0.5 h-4 w-4 accent-forest"
        />
        <span>
          <span className="block text-sm font-medium text-ink">Activar avisos en este navegador</span>
          <span className="mt-0.5 block text-xs leading-snug text-ink/55">
            Los mismos avisos push. Al enviar el formulario pedimos permiso y, al abrir el enlace, se vinculan a tu
            cuenta.
          </span>
        </span>
      </label>
      <button
        type="submit"
        disabled={bloqueado}
        className="inline-flex items-center justify-center rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pine disabled:cursor-default disabled:opacity-90"
      >
        {estado === "enviando" ? "Enviando…" : estado === "enviado" ? "Enlace enviado" : "Enviarme el enlace"}
      </button>
      <p id={ayudaId} className={`text-sm leading-snug ${estado === "error" ? "text-fire" : "text-ink/60"}`}>
        {mensaje || "Te escribimos cuando abra una inscripción. El enlace hay que abrirlo aquí."}
      </p>
    </form>
  );
}
