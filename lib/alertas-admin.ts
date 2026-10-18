import { ONESIGNAL_APP_ID, ONESIGNAL_EXTERNAL_ID } from "./onesignal-web";

export const ADMIN_EMAIL_POR_DEFECTO = "avilesia2026@gmail.com";
/** Grupo VIP privado ya usado. Se puede sustituir con ALERTAS_TELEGRAM_CHAT_ID. */
export const TELEGRAM_CHAT_ID_POR_DEFECTO = "-1004437925569";

/** Flujos n8n ya existentes. Una variable de entorno https los sustituye. */
export const WEBHOOKS_N8N = {
  telegram: "https://vps-faf1945e.vps.ovh.net/webhook/generico-telegram",
  /** Ruta protegida con la cabecera X-N8N-Generico-Token (18-oct). Se usa si hay ALERTAS_TELEGRAM_WEBHOOK_TOKEN. */
  telegramCabecera: "https://vps-faf1945e.vps.ovh.net/webhook/generico-telegram-v2",
  email: "https://vps-faf1945e.vps.ovh.net/webhook/generico-email",
  push: "https://vps-faf1945e.vps.ovh.net/webhook/generico-web-push",
} as const;

export type CanalAviso = "telegram" | "push" | "email";

export type ResultadoCanal = {
  canal: CanalAviso;
  estado: "enviado" | "omitido" | "error";
  motivo?: string;
};

export type AvisoRegistro = {
  email: string;
  userId: string;
  nombre: string;
  instagram: string | null;
  correoAvisos: string;
  telegram: "pendiente" | "conectado";
  pushActivado: boolean;
};

type EnvLike = Record<string, string | undefined>;

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type NotificarOpciones = {
  prueba?: boolean;
  env?: EnvLike;
  fetchImpl?: FetchLike;
};

type CuerpoBase = {
  app: "carreras";
  tipo: "registro_alertas";
  canal: CanalAviso;
  prueba: boolean;
  ok_emitir: boolean;
  confirmar: boolean;
  correo_usuario: string;
  user_id: string;
  correo_destino: string;
  chat_id: string;
  external_id: string;
  asunto: string;
  mensaje: string;
  nombre: string;
  instagram: string | null;
  correo_avisos: string;
  telegram: "pendiente" | "conectado";
  push_activado: boolean;
};

type CuerpoTelegram = CuerpoBase & {
  canal: "telegram";
  id_dedup: string;
};

type CuerpoEmail = CuerpoBase & {
  canal: "email";
  id_dedup: string;
  to: string;
  copy: string;
  html: string;
  body: string;
};

type CuerpoPush = CuerpoBase & {
  canal: "push";
  title: string;
  body: string;
};

export type CuerpoWebhook = CuerpoTelegram | CuerpoEmail | CuerpoPush;

const CANALES: CanalAviso[] = ["telegram", "push", "email"];

function leer(env: EnvLike, ...claves: string[]): string | null {
  for (const clave of claves) {
    const valor = env[clave]?.trim();
    if (valor) return valor;
  }
  return null;
}

/** Secreto de la cabecera X-N8N-Generico-Token del genérico de Telegram (solo servidor). */
export function tokenWebhookTelegram(env: EnvLike = process.env): string | null {
  return leer(env, "ALERTAS_TELEGRAM_WEBHOOK_TOKEN");
}

/** Cabeceras extra para el webhook de un canal. */
export function cabecerasWebhook(canal: CanalAviso, env: EnvLike): Record<string, string> | undefined {
  const token = canal === "telegram" ? tokenWebhookTelegram(env) : null;
  return token ? { "x-n8n-generico-token": token } : undefined;
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
  if (generico) return urlHttps(generico);
  if (canal === "telegram" && tokenWebhookTelegram(env)) return WEBHOOKS_N8N.telegramCabecera;
  return WEBHOOKS_N8N[canal];
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
  const push = aviso.pushActivado ? "sí" : "no";
  const telegram = aviso.telegram === "conectado" ? "conectado" : "pendiente";
  const mensaje = [
    "Nuevo registro de avisos en Carreras Asturias.",
    `Correo: ${aviso.email}.`,
    `Avisos: ${aviso.correoAvisos}.`,
    `Telegram: ${telegram}.`,
    `Push: ${push}.`,
  ].join(" ");
  return { asunto: "Nuevo registro de avisos · Carreras Asturias", mensaje };
}

export function cuerpoWebhook(
  canal: CanalAviso,
  aviso: AvisoRegistro,
  prueba: boolean,
  env: EnvLike,
): CuerpoWebhook {
  const texto = mensajeRegistro(aviso, prueba);
  const base: CuerpoBase = {
    app: "carreras",
    tipo: "registro_alertas",
    canal,
    prueba,
    ok_emitir: !prueba,
    confirmar: !prueba,
    correo_usuario: aviso.email,
    user_id: aviso.userId,
    correo_destino: correoAdmin(env),
    chat_id: chatTelegramAdmin(env),
    external_id: leer(env, "NEXT_PUBLIC_ONESIGNAL_EXTERNAL_ID") || ONESIGNAL_EXTERNAL_ID,
    asunto: texto.asunto,
    mensaje: texto.mensaje,
    nombre: aviso.nombre,
    instagram: aviso.instagram,
    correo_avisos: aviso.correoAvisos,
    telegram: aviso.telegram,
    push_activado: aviso.pushActivado,
  };

  if (canal === "telegram") {
    return { ...base, canal, id_dedup: `registro-${aviso.userId}` };
  }
  if (canal === "email") {
    return {
      ...base,
      canal,
      id_dedup: `registro-${aviso.userId}`,
      to: base.correo_destino,
      copy: texto.mensaje,
      html: texto.mensaje,
      body: texto.mensaje,
    };
  }
  return { ...base, canal, title: texto.asunto, body: texto.mensaje };
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
      const resultado = await postJson(opciones.fetchImpl, webhook, cuerpo, cabecerasWebhook(canal, opciones.env));
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
