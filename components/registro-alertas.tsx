"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { cuentaRegistroValida, RUTA_ACCESO } from "@/lib/registro-alertas";
import { getSupabase } from "@/lib/supabase";

type Estado = "listo" | "enviando" | "hecho" | "error";

const CAMPO =
  "mt-1.5 w-full rounded-2xl border border-forest/15 bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-atlantic/50 disabled:opacity-70";

export function RegistroAlertas() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [correoAvisos, setCorreoAvisos] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [estado, setEstado] = useState<Estado>("listo");
  const [mensaje, setMensaje] = useState("");
  const bloqueado = estado === "enviando" || estado === "hecho";

  async function alEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueado) return;
    const validada = cuentaRegistroValida({ correo, password, correoAvisos, consentimiento });
    if (!validada.ok) {
      setEstado("error");
      setMensaje(validada.error);
      return;
    }

    setEstado("enviando");
    setMensaje("");
    const response = await fetch("/api/registro", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        correo,
        password,
        correoAvisos,
        consentimiento,
        origen: window.location.origin,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; confirmarCorreo?: boolean };
    if (!response.ok || !body.ok) {
      setEstado("error");
      setMensaje(body.error || "No se pudo crear la cuenta.");
      return;
    }

    const acceso = await getSupabase().auth.signInWithPassword({
      email: validada.cuenta.correo,
      password: validada.cuenta.password,
    });
    if (acceso.data.session) {
      window.location.href = "/avisos";
      return;
    }

    setEstado("hecho");
    setMensaje(
      body.confirmarCorreo
        ? "Cuenta creada. Revisa tu correo para confirmarla. Cuando entres, en «Mis avisos» puedes conectar Telegram y activar los avisos en este móvil."
        : "Cuenta creada. Entra para conectar Telegram y activar los avisos.",
    );
  }

  return (
    <form onSubmit={(event) => void alEnviar(event)} className="mt-6 space-y-4" noValidate>
      <section className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-4 text-sm text-ink/75">
        <h2 className="font-display text-lg font-bold text-ink">Cómo te avisamos</h2>
        <p className="mt-1 text-ink/60">
          Un aviso cuando abra una inscripción. Por correo se activa al crear la cuenta. Telegram y el móvil se
          encienden después, en Mis avisos.
        </p>
        <ul className="mt-3 space-y-2">
          <li>
            <strong>Correo.</strong> Un mensaje con el aviso. Se activa al crear la cuenta; solo tienes que confirmar
            tu correo.
          </li>
          <li>
            <strong>Telegram.</strong> El mismo aviso en un chat privado con el bot @AvilesIA_bot, que solo ves tú.
            Actívalo después en «Mis avisos» con el botón «Conectar Telegram».
          </li>
          <li>
            <strong>En el navegador o el móvil.</strong> Una notificación en la pantalla. Actívala después en «Mis
            avisos» con el botón «Activar avisos en este móvil». En iPhone solo funciona si antes añades esta web a
            la pantalla de inicio (Compartir → «Añadir a pantalla de inicio») y la abres desde ese icono.
          </li>
        </ul>
      </section>
      <label className="block text-sm font-medium text-ink">
        Correo electrónico
        <input
          type="email"
          name="correo"
          autoComplete="email"
          required
          value={correo}
          disabled={bloqueado}
          onChange={(event) => setCorreo(event.target.value)}
          className={CAMPO}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Contraseña
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          disabled={bloqueado}
          onChange={(event) => setPassword(event.target.value)}
          className={CAMPO}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Correo para los avisos
        <input
          type="email"
          name="correoAvisos"
          autoComplete="email"
          placeholder="Si lo dejas vacío, el mismo de la cuenta"
          value={correoAvisos}
          disabled={bloqueado}
          onChange={(event) => setCorreoAvisos(event.target.value)}
          className={CAMPO}
        />
      </label>
      <label className="flex items-start gap-3 rounded-2xl border border-forest/10 bg-white/70 px-4 py-3 text-sm text-ink/80">
        <input
          type="checkbox"
          name="consentimiento"
          required
          checked={consentimiento}
          disabled={bloqueado}
          onChange={(event) => setConsentimiento(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-forest"
        />
        <span>
          Acepto recibir avisos de carreras en ese correo (y, si los activo, por Telegram y en el navegador), y que se
          guarde para ese único fin. Puedo darme de baja cuando quiera en «Mis avisos». He leído la{" "}
          <Link href="/privacidad" target="_blank" className="font-semibold text-forest underline-offset-2 hover:underline">
            política de privacidad
          </Link>
          .
        </span>
      </label>
      {mensaje ? (
        <p className={estado === "error" ? "text-sm text-fire" : "text-sm text-ink/70"} role={estado === "error" ? "alert" : "status"}>
          {mensaje}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={bloqueado}
        className="inline-flex items-center justify-center rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pine disabled:cursor-default disabled:opacity-90"
      >
        {estado === "enviando" ? "Creando tu cuenta…" : "Crear cuenta"}
      </button>
      <p className="text-sm text-ink/60">
        <Link href={RUTA_ACCESO} className="font-semibold text-forest underline-offset-2 hover:underline">
          Volver a entrar
        </Link>
      </p>
    </form>
  );
}
