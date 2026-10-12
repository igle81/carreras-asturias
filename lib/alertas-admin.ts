import { ONESIGNAL_APP_ID, ONESIGNAL_EXTERNAL_ID } from "./onesignal-web";

export const ADMIN_EMAIL_POR_DEFECTO = "avilesia2026@gmail.com";
/** Grupo VIP privado ya usado. Se puede sustituir con ALERTAS_TELEGRAM_CHAT_ID. */
export const TELEGRAM_CHAT_ID_POR_DEFECTO = "-1004437925569";

export type CanalAviso = "telegram" | "push" | "email";

export type ResultadoCanal = {
  canal: CanalAviso;
  estado: "enviado" | "omitido" | "error";
  motivo?: string;
};

export type AvisoRegistro = {
  email: string;
  userId: string;
};

type EnvLike = Record<string, string | undefined>;

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type NotificarOpciones = {
  prueba?: boolean;
  env?: EnvLike;
  fetchImpl?: FetchLike;
};

type CuerpoWebhook = {
  app: "carreras";
  tipo: "registro_alertas";
  canal: CanalAviso;
  prueba: boolean;
  ok_emitir: boolean;
  correo_usuario: string;
  user_id: string;
  correo_destino: string;
  chat_id: string;
  external_id: string;
  asunto: string;
  mensaje: string;
};

const CANALES: CanalAviso[] = ["telegram", "push", "email"];

function leer(env: EnvLike, ...claves: string[]): string | null {
  for (const clave of claves) {
    const valor = env[clave]?.trim();
    if (valor) return valor;
  }
  return null;
}

export function chatTelegramAdmin(env: EnvLike = process.env): string {
  return leer(env, "ALERTAS_TELEGRAM_CHAT_ID") || TELEGRAM_CHAT_ID_POR_DEFECTO;
}

export function correoAdmin(env: EnvLike = process.env): string {
  return leer(env, "ALERTAS_ADMIN_EMAIL") || ADMIN_EMAIL_POR_DEFECTO;
}

export function webhookCanal(canal: CanalAviso, env: EnvLike): string | null {
  const especifico = leer(
    env,
    canal === "telegram"
      ? "ALERTAS_WEBHOOK_TELEGRAM"
      : canal === "email"
        ? "ALERTAS_WEBHOOK_EMAIL"
        : "ALERTAS_WEBHOOK_PUSH",
    canal === "telegram"
      ? "N8N_WEBHOOK_TELEGRAM"
      : canal === "email"
        ? "N8N_WEBHOOK_EMAIL"
        : "N8N_WEBHOOK_PUSH",
  );
  if (especifico) return urlHttps(especifico);
  const generico = leer(env, "N8N_WEBHOOK_ALERTAS", "N8N_WEBHOOK_URL");
  return generico ? urlHttps(generico) : null;
}

function urlHttps(valor: string): string | null {
  try {
    const url = new URL(valor);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function mensajeRegistro(aviso: AvisoRegistro, prueba: boolean): { asunto: string; mensaje: string } {
  if (prueba) {
    const mensaje =
      "[PRUEBA] Registro de avisos de Carreras Asturias. No es un alta real. ok_emitir=false.";
    return { asunto: "[PRUEBA] Carreras Asturias · registro de avisos", mensaje };
  }
  const mensaje = `Nuevo registro de avisos en Carreras Asturias. Correo: ${aviso.email}`;
  return { asunto: "Nuevo registro de avisos · Carreras Asturias", mensaje };
}

export function cuerpoWebhook(
  canal: CanalAviso,
  aviso: AvisoRegistro,
  prueba: boolean,
  env: EnvLike,
): CuerpoWebhook {
  const texto = mensajeRegistro(aviso, prueba);
  return {
    app: "carreras",
    tipo: "registro_alertas",
    canal,
    prueba,
    ok_emitir: !prueba,
    correo_usuario: aviso.email,
    user_id: aviso.userId,
    correo_destino: correoAdmin(env),
    chat_id: chatTelegramAdmin(env),
    external_id: leer(env, "NEXT_PUBLIC_ONESIGNAL_EXTERNAL_ID") || ONESIGNAL_EXTERNAL_ID,
    asunto: texto.asunto,
    mensaje: texto.mensaje,
  };
}

async function postJson(
  fetchImpl: FetchLike,
  url: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<{ ok: boolean; status: number }> {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  return { ok: response.ok, status: response.status };
}

async function enviarCanal(
  canal: CanalAviso,
  aviso: AvisoRegistro,
  opciones: Required<Pick<NotificarOpciones, "prueba" | "env" | "fetchImpl">>,
): Promise<ResultadoCanal> {
  const cuerpo = cuerpoWebhook(canal, aviso, opciones.prueba, opciones.env);
  const webhook = webhookCanal(canal, opciones.env);

  try {
    if (webhook) {
      const resultado = await postJson(opciones.fetchImpl, webhook, cuerpo);
      return resultado.ok
        ? { canal, estado: "enviado" }
        : { canal, estado: "error", motivo: `http_${resultado.status}` };
    }

    if (canal === "telegram") {
      const token = leer(opciones.env, "TELEGRAM_BOT_TOKEN");
      if (!token) return { canal, estado: "omitido", motivo: "sin_webhook" };
      const resultado = await postJson(
        opciones.fetchImpl,
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          chat_id: cuerpo.chat_id,
          text: cuerpo.mensaje,
          disable_web_page_preview: true,
        },
      );
      return resultado.ok
        ? { canal, estado: "enviado" }
        : { canal, estado: "error", motivo: `http_${resultado.status}` };
    }

    if (canal === "push") {
      const key = leer(opciones.env, "ONESIGNAL_REST_API_KEY");
      if (!key) return { canal, estado: "omitido", motivo: "sin_webhook" };
      const resultado = await postJson(
        opciones.fetchImpl,
        "https://api.onesignal.com/notifications",
        {
          app_id: ONESIGNAL_APP_ID,
          target_channel: "push",
          include_aliases: { external_id: [cuerpo.external_id] },
          headings: { es: cuerpo.asunto, en: cuerpo.asunto },
          contents: { es: cuerpo.mensaje, en: cuerpo.mensaje },
        },
        { authorization: `Key ${key}` },
      );
      return resultado.ok
        ? { canal, estado: "enviado" }
        : { canal, estado: "error", motivo: `http_${resultado.status}` };
    }

    return { canal, estado: "omitido", motivo: "sin_webhook" };
  } catch {
    return { canal, estado: "error", motivo: "red" };
  }
}

/** Avisa al administrador por Telegram, push y correo. No lanza: cada canal informa su estado. */
export async function notificarAdminRegistro(
  aviso: AvisoRegistro,
  opciones: NotificarOpciones = {},
): Promise<ResultadoCanal[]> {
  const prueba = opciones.prueba === true;
  const env = opciones.env ?? process.env;
  const fetchImpl = opciones.fetchImpl ?? fetch;
  return Promise.all(CANALES.map((canal) => enviarCanal(canal, aviso, { prueba, env, fetchImpl })));
}
