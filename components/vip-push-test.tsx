"use client";

import { useState } from "react";
import {
  VIP_TEST_EXTERNAL_ID,
  initOneSignal,
  permissionDeniedMessage,
  pushUnsupportedMessage,
  toErrorMessage,
} from "@/lib/onesignal-web";

type Status =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "success" }
  | { kind: "error"; message: string };

async function permissionGranted(
  onesignal: Awaited<ReturnType<typeof initOneSignal>>,
): Promise<boolean> {
  const requested = await onesignal.Notifications.requestPermission();
  if (requested === true || onesignal.Notifications.permission) return true;
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    return true;
  }
  return false;
}

export function VipPushTest() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleActivate() {
    if (status.kind === "working") return;
    setStatus({ kind: "working" });

    try {
      const onesignal = await initOneSignal();

      if (!onesignal.Notifications.isPushSupported()) {
        throw new Error(pushUnsupportedMessage());
      }

      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        throw new Error(permissionDeniedMessage());
      }

      const granted = await permissionGranted(onesignal);
      if (!granted) {
        throw new Error(permissionDeniedMessage());
      }

      await onesignal.login(VIP_TEST_EXTERNAL_ID);
      await onesignal.User.addTag("vip", "true");

      setStatus({ kind: "success" });
    } catch (error) {
      setStatus({ kind: "error", message: toErrorMessage(error) });
    }
  }

  return (
    <div className="mt-8 rounded-[2rem] bg-ink px-6 py-8 text-white sm:px-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Interno</p>
      <h2 className="mt-2 font-display text-2xl font-black">Push VIP de prueba</h2>
      <p className="mt-3 max-w-xl text-white/75">
        Este botón no es un enlace: activa las notificaciones en este mismo
        navegador y las asocia al perfil VIP de prueba. Usa HTTPS en el dominio
        de producción (www.carrerasasturias.es o carrerasasturias.es, según la
        Site URL de OneSignal), no localhost ni modo privado. No hay enlace
        público ni canal Telegram.
      </p>

      <button
        type="button"
        onClick={() => void handleActivate()}
        disabled={status.kind === "working"}
        className="mt-6 inline-flex max-w-full items-center justify-center rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink disabled:cursor-wait disabled:opacity-70"
      >
        {status.kind === "working" ? "Activando…" : "Activar push VIP de prueba"}
      </button>

      {status.kind === "success" ? (
        <p role="status" className="mt-4 text-sm font-semibold text-gold">
          Push VIP de prueba activado en este dispositivo
        </p>
      ) : null}

      {status.kind === "error" ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-fire">
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
