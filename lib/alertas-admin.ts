/**
 * Aviso al administrador cuando alguien se da de alta en los avisos.
 *
 * 18-oct (Seguridad N1 + decisión de Javier): solo queda el email al buzón del
 * administrador. Se han eliminado el aviso por Telegram (grupo VIP, ya borrado)
 * y el push al administrador. Lo que va a n8n no lleva nombre ni Instagram, ni
 * campos sueltos con el correo del usuario: el correo completo va solo dentro
 * del texto del email.
 */

export const ADMIN_EMAIL_POR_DEFECTO = "avilesia2026@gmail.com";

/** Flujo n8n ya existente. Una variable de entorno https lo sustituye. */
export const WEBHOOKS_N8N = {
  email: "https://vps-faf1945e.vps.ovh.net/webhook/generico-email",
} as const;

export type CanalAviso = "email";

export type ResultadoCanal = {
  canal: CanalAviso;
  estado: "enviado" | "omitido" | "error";
  motivo?: string;
};

export type AvisoRegistro = {
  email: string;
  userId: string;
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

/** Lo que recibe el flujo generico-email de n8n: lo mínimo para mandar el email al administrador. */
export type CuerpoWebhook = {
  app: "carreras";
  tipo: "registro_alertas";
  canal: "email";
  prueba: boolean;
  ok_emitir: boolean;
  confirmar: boolean;
  id_dedup: string;
  to: string;
  asunto: string;
  mensaje: string;
  copy: string;
  html: string;
  body: string;
};

function leer(env: EnvLike, ...claves: string[]): string | null {
  for (const clave of claves) {
    const valor = env[clave]?.trim();
    if (valor) return valor;
  }
  return null;
}

export function correoAdmin(env: EnvLike = process.env): string {
  return leer(env, "ALERTAS_ADMIN_EMAIL") || ADMIN_EMAIL_POR_DEFECTO;
}

export function webhookEmail(env: EnvLike): string | null {
  const especifico = leer(env, "ALERTAS_WEBHOOK_EMAIL", "N8N_WEBHOOK_EMAIL");
  if (especifico) return urlHttps(especifico);
  const generico = leer(env, "N8N_WEBHOOK_ALERTAS", "N8N_WEBHOOK_URL");
  if (generico) return urlHttps(generico);
  return WEBHOOKS_N8N.email;
}

/**
 * Secreto de la cabecera X-N8N-Generico-Token (solo servidor). Los genéricos de n8n
 * pasan a exigirla; mientras no la exijan, mandarla no cambia nada.
 * ALERTAS_TELEGRAM_WEBHOOK_TOKEN se mantiene porque es la variable que ya existe en Vercel.
 */
export function tokenWebhook(env: EnvLike = process.env): string | null {
  return leer(env, "ALERTAS_WEBHOOK_TOKEN", "ALERTAS_TELEGRAM_WEBHOOK_TOKEN");
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

/** Primeros 8 caracteres del user_id (sin guiones). */
export function idCorto(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8);
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function mensajeRegistro(aviso: AvisoRegistro, prueba: boolean): { asunto: string; mensaje: string } {
  if (prueba) {
    const mensaje =
      "[PRUEBA] Registro de avisos de Carreras Asturias. No es un alta real. ok_emitir=false.";
    return { asunto: "[PRUEBA] Carreras Asturias · registro de avisos", mensaje };
  }
  const push = aviso.pushActivado ? "sí" : "no";
  const telegram = aviso.telegram === "conectado" ? "conectado" : "pendiente";
  const avisos =
    aviso.correoAvisos.trim().toLowerCase() === aviso.email.trim().toLowerCase()
      ? "el mismo"
      : escaparHtml(aviso.correoAvisos);
  const mensaje = [
    "Nuevo registro de avisos en Carreras Asturias.",
    `Correo: ${escaparHtml(aviso.email)}.`,
    `Avisos: ${avisos}.`,
    `Id: ${idCorto(aviso.userId)}.`,
    `Telegram: ${telegram}.`,
    `Push: ${push}.`,
  ].join(" ");
  return { asunto: "Nuevo registro de avisos · Carreras Asturias", mensaje };
}

export function cuerpoWebhook(aviso: AvisoRegistro, prueba: boolean, env: EnvLike): CuerpoWebhook {
  const texto = mensajeRegistro(aviso, prueba);
  return {
    app: "carreras",
    tipo: "registro_alertas",
    canal: "email",
    prueba,
    ok_emitir: !prueba,
    confirmar: !prueba,
    id_dedup: `registro-${idCorto(aviso.userId)}`,
    to: correoAdmin(env),
    asunto: texto.asunto,
    mensaje: texto.mensaje,
    copy: texto.mensaje,
    html: texto.mensaje,
    body: texto.mensaje,
  };
}

/** Avisa al administrador por email. No lanza: devuelve el estado del canal. */
export async function notificarAdminRegistro(
  aviso: AvisoRegistro,
  opciones: NotificarOpciones = {},
): Promise<ResultadoCanal[]> {
  const prueba = opciones.prueba === true;
  const env = opciones.env ?? process.env;
  const fetchImpl = opciones.fetchImpl ?? fetch;
  const webhook = webhookEmail(env);
  if (!webhook) return [{ canal: "email", estado: "omitido", motivo: "sin_webhook" }];
  const token = tokenWebhook(env);
  const cabeceras: Record<string, string> = token ? { "x-n8n-generico-token": token } : {};
  try {
    const response = await fetchImpl(webhook, {
      method: "POST",
      headers: { "content-type": "application/json", ...cabeceras },
      body: JSON.stringify(cuerpoWebhook(aviso, prueba, env)),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok
      ? [{ canal: "email", estado: "enviado" }]
      : [{ canal: "email", estado: "error", motivo: `http_${response.status}` }];
  } catch {
    return [{ canal: "email", estado: "error", motivo: "red" }];
  }
}
