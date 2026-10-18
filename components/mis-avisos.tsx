"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { mensajeErrorAvisos, prepararPushRegistro, vincularPushAUsuario } from "@/lib/onesignal-web";
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

  if (!listo) {
    return <p className="mt-6 text-sm text-muted">Cargando tus avisos…</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-4 text-sm">
        <h2 className="font-display text-lg font-bold text-ink">Correo</h2>
        <p className="mt-1 text-ink/70">
          {perfil?.baja_en
            ? "Los avisos por correo están de baja."
            : `Te escribimos a ${perfil?.correo_avisos || "tu correo"}.`}
        </p>
      </section>
      <section className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-4 text-sm">
        <h2 className="font-display text-lg font-bold text-ink">Telegram</h2>
        <p className="mt-1 text-ink/70">
          {telegram?.chat_id
            ? "Conectado. Los avisos llegan a tu chat privado con @AvilesIA_bot."
            : "Aún no está conectado. Es un chat privado contigo, no un canal público."}
        </p>
        <button
          type="button"
          onClick={() => void conectarTelegram()}
          className="mt-3 inline-flex rounded-full border border-forest/15 bg-white px-4 py-2 text-xs font-semibold text-forest"
        >
          Conectar Telegram
        </button>
      </section>
      <section className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-4 text-sm">
        <h2 className="font-display text-lg font-bold text-ink">En este móvil</h2>
        <p className="mt-1 text-ink/70">
          {perfil?.push_activado
            ? "Los avisos de este navegador están activados."
            : "Una notificación en la pantalla. En iPhone, añade antes la web a la pantalla de inicio."}
        </p>
        <button
          type="button"
          onClick={() => void activarPush()}
          className="mt-3 inline-flex rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white"
        >
          Activar avisos en este móvil
        </button>
      </section>
      {mensaje ? <p className="text-sm text-ink/70">{mensaje}</p> : null}
      {error ? (
        <p className="text-sm text-fire" role="alert">
          {error}
        </p>
      ) : null}
      <button type="button" onClick={() => void darseDeBaja()} className="text-sm font-semibold text-forest underline-offset-2 hover:underline">
        Darme de baja de los avisos
      </button>
      <button
        type="button"
        onClick={() => void cerrarSesion().catch(() => setError("No se ha podido cerrar la sesión."))}
        className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
      >
        Salir
      </button>
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
