"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { desvincularPush, mensajeErrorAvisos, prepararPushRegistro, vincularPushAUsuario } from "@/lib/onesignal-web";
import {
  MENSAJE_CORREO_REACTIVADO,
  RPC_REACTIVAR_CORREO,
  TEXTO_VOLVER_CORREO,
  textoBotonTelegram,
  textoEstadoCorreo,
} from "@/lib/mis-avisos";
import { RUTA_ACCESO, RUTA_REGISTRO, urlTelegramBot } from "@/lib/registro-alertas";
import { cerrarSesion } from "@/lib/sesion-cuenta";
import { getSupabase } from "@/lib/supabase";

type Perfil = {
  correo_avisos: string | null;
  baja_en: string | null;
  push_activado: boolean;
};

type Telegram = { chat_id: number | null } | null;

export function MisAvisos() {
  const [listo, setListo] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [telegram, setTelegram] = useState<Telegram>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        window.location.href = RUTA_ACCESO;
        return;
      }
      const db = getSupabaseCarreras();
      const userId = session.user.id;
      const { data: fila } = await db
        .from("suscripciones_alertas")
        .select("correo_avisos,baja_en,push_activado")
        .eq("user_id", userId)
        .maybeSingle();
      if (!fila && session.access_token) {
        await fetch("/api/alertas/suscribir", {
          method: "POST",
          headers: {
            authorization: `Bearer ${session.access_token}`,
            "content-type": "application/json",
          },
          body: "{}",
        });
      }
      const { data: actual } = await db
        .from("suscripciones_alertas")
        .select("correo_avisos,baja_en,push_activado")
        .eq("user_id", userId)
        .maybeSingle();
      const { data: tg } = await db.from("alertas_telegram").select("chat_id").eq("user_id", userId).maybeSingle();
      if (cancelado) return;
      setPerfil((actual as Perfil | null) ?? null);
      setTelegram((tg as Telegram) ?? null);
      setListo(true);
    }
    void cargar().catch(() => {
      if (!cancelado) {
        setError("No se han podido cargar tus avisos.");
        setListo(true);
      }
    });
    return () => {
      cancelado = true;
    };
  }, []);

  async function conectarTelegram() {
    setError("");
    const db = getSupabaseCarreras();
    const { data, error: rpcError } = await db.rpc("alertas_telegram_codigo");
    if (rpcError || typeof data !== "string") {
      setError("No se ha podido preparar Telegram. Entra de nuevo e inténtalo.");
      return;
    }
    window.open(urlTelegramBot(data), "_blank", "noopener");
    setMensaje("Se abre el chat con @AvilesIA_bot. Pulsa Iniciar en Telegram para conectar este aviso.");
  }

  async function activarPush() {
    setError("");
    const { data } = await getSupabase().auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) {
      window.location.href = RUTA_ACCESO;
      return;
    }
    try {
      await prepararPushRegistro();
      await vincularPushAUsuario(userId);
      const { error: updateError } = await getSupabaseCarreras()
        .from("suscripciones_alertas")
        .update({ push_activado: true, actualizado_en: new Date().toISOString() })
        .eq("user_id", userId);
      if (updateError) throw updateError;
      setPerfil((actual) => (actual ? { ...actual, push_activado: true } : actual));
      setMensaje("Avisos activados en este móvil.");
    } catch (causa) {
      setError(mensajeErrorAvisos(causa));
    }
  }

  async function desactivarPush() {
    setError("");
    const { data } = await getSupabase().auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) {
      window.location.href = RUTA_ACCESO;
      return;
    }
    await desvincularPush();
    const { error: updateError } = await getSupabaseCarreras()
      .from("suscripciones_alertas")
      .update({ push_activado: false, actualizado_en: new Date().toISOString() })
      .eq("user_id", userId);
    if (updateError) {
      setError("No se han podido desactivar las notificaciones.");
      return;
    }
    setPerfil((actual) => (actual ? { ...actual, push_activado: false } : actual));
    setMensaje("Notificaciones desactivadas. El correo y Telegram siguen como estaban.");
  }

  async function desconectarTelegram() {
    setError("");
    const { data, error: rpcError } = await getSupabaseCarreras().rpc("alertas_telegram_desconectar");
    if (rpcError || typeof data !== "boolean") {
      setError("No se ha podido desconectar Telegram. Entra de nuevo e inténtalo.");
      return;
    }
    setTelegram(null);
    setMensaje("Telegram desconectado. Hemos borrado el identificador de tu chat. El correo y las notificaciones siguen como estaban.");
  }

  async function darseDeBaja() {
    const { data } = await getSupabase().auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;
    const { error: updateError } = await getSupabaseCarreras()
      .from("suscripciones_alertas")
      .update({ baja_en: new Date().toISOString(), actualizado_en: new Date().toISOString() })
      .eq("user_id", userId);
    if (updateError) {
      setError("No se ha podido guardar la baja.");
      return;
    }
    setPerfil((actual) => (actual ? { ...actual, baja_en: new Date().toISOString() } : actual));
    setMensaje("Te has dado de baja de los avisos. La cuenta sigue existiendo.");
  }

  async function volverARecibirCorreo() {
    setError("");
    setMensaje("");
    const { data } = await getSupabase().auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) {
      window.location.href = RUTA_ACCESO;
      return;
    }
    const db = getSupabaseCarreras();
    const { data: hecho, error: rpcError } = await db.rpc(RPC_REACTIVAR_CORREO);
    if (rpcError || typeof hecho !== "boolean") {
      setError("No se ha podido reactivar el correo. Entra de nuevo e inténtalo.");
      return;
    }
    const { data: actual } = await db
      .from("suscripciones_alertas")
      .select("correo_avisos,baja_en,push_activado")
      .eq("user_id", userId)
      .maybeSingle();
    if (actual) setPerfil(actual as Perfil);
    if (actual && (actual as Perfil).baja_en) {
      setError("No se ha podido reactivar el correo. Comprueba que tu correo está confirmado.");
      return;
    }
    setMensaje(MENSAJE_CORREO_REACTIVADO);
  }

  if (!listo) {
    return <p className="mt-6 text-sm text-muted">Cargando tus avisos…</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-4 text-sm">
        <h2 className="font-display text-lg font-bold text-ink">Correo</h2>
        <p className="mt-1 text-ink/70">{textoEstadoCorreo(perfil?.baja_en, perfil?.correo_avisos)}</p>
        {perfil?.baja_en ? (
          <>
            <button
              type="button"
              onClick={() => void volverARecibirCorreo()}
              className="mt-3 inline-flex rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white"
            >
              {TEXTO_VOLVER_CORREO}
            </button>
            <p className="mt-2 text-xs text-ink/60">
              Al pulsarlo aceptas de nuevo recibir avisos de carreras en el correo de tu cuenta.{" "}
              <Link href="/privacidad" className="underline underline-offset-2">
                Privacidad
              </Link>
              .
            </p>
          </>
        ) : null}
      </section>
      <section className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-4 text-sm">
        <h2 className="font-display text-lg font-bold text-ink">Telegram</h2>
        <p className="mt-1 text-ink/70">
          {telegram?.chat_id
            ? "Conectado. Los avisos llegan a tu chat privado con @AvilesIA_bot."
            : "Aún no está conectado. Es un chat privado contigo, no un canal público."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void conectarTelegram()}
            className="inline-flex rounded-full border border-forest/15 bg-white px-4 py-2 text-xs font-semibold text-forest"
          >
            {textoBotonTelegram(Boolean(telegram?.chat_id))}
          </button>
          {telegram?.chat_id ? (
            <button
              type="button"
              onClick={() => void desconectarTelegram()}
              className="inline-flex rounded-full border border-forest/15 bg-white px-4 py-2 text-xs font-semibold text-forest"
            >
              Desconectar Telegram
            </button>
          ) : null}
        </div>
      </section>
      <section className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-4 text-sm">
        <h2 className="font-display text-lg font-bold text-ink">En este móvil</h2>
        <p className="mt-1 text-ink/70">
          {perfil?.push_activado
            ? "Los avisos de este navegador están activados."
            : "Una notificación en la pantalla. En iPhone, añade antes la web a la pantalla de inicio."}
        </p>
        {perfil?.push_activado ? (
          <button
            type="button"
            onClick={() => void desactivarPush()}
            className="mt-3 inline-flex rounded-full border border-forest/15 bg-white px-4 py-2 text-xs font-semibold text-forest"
          >
            Desactivar notificaciones
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void activarPush()}
            className="mt-3 inline-flex rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white"
          >
            Activar avisos en este móvil
          </button>
        )}
      </section>
      {mensaje ? <p className="text-sm text-ink/70">{mensaje}</p> : null}
      {error ? (
        <p className="text-sm text-fire" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col items-start gap-4">
      {perfil?.baja_en ? null : (
        <div className="space-y-1">
          <button type="button" onClick={() => void darseDeBaja()} className="text-sm font-semibold text-forest underline-offset-2 hover:underline">
            Darme de baja de todos los avisos
          </button>
          <p className="text-xs text-ink/60">
            Corta el correo, las notificaciones y Telegram. Si cambias de idea, puedes volver a recibir avisos por correo desde esta página.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => void cerrarSesion().catch(() => setError("No se ha podido cerrar la sesión."))}
        className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
      >
        Salir
      </button>
      </div>
      <p className="text-sm text-ink/70">
        ¿Primera vez?{" "}
        <Link href={RUTA_REGISTRO} className="font-semibold text-forest underline-offset-2 hover:underline">
          Crear una cuenta
        </Link>
      </p>
    </div>
  );
}

function getSupabaseCarreras() {
  return getSupabase().schema("carreras");
}
