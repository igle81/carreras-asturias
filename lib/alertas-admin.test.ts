import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cuerpoWebhook,
  mensajeRegistro,
  notificarAdminRegistro,
  TELEGRAM_CHAT_ID_POR_DEFECTO,
  WEBHOOKS_N8N,
} from "./alertas-admin";

const AVISO = {
  email: "corredor@ejemplo.es",
  userId: "user-1",
  nombre: "",
  instagram: null as string | null,
  correoAvisos: "avisos@ejemplo.es",
  telegram: "pendiente" as const,
  pushActivado: false,
};

test("un alta real pide emitir y el correo lleva el texto en los campos de n8n", () => {
  const cuerpo = cuerpoWebhook("email", AVISO, false, {});
  assert.equal(cuerpo.ok_emitir, true);
  assert.equal(cuerpo.confirmar, true);
  assert.equal(cuerpo.prueba, false);
  assert.equal(cuerpo.id_dedup, "registro-user-1");
  assert.equal(cuerpo.to, "avilesia2026@gmail.com");
  assert.equal(cuerpo.correo_destino, "avilesia2026@gmail.com");
  assert.equal(cuerpo.asunto, "Nuevo registro de avisos · Carreras Asturias");
  assert.equal(cuerpo.copy, cuerpo.mensaje);
  assert.equal(cuerpo.html, cuerpo.mensaje);
  assert.equal(cuerpo.body, cuerpo.mensaje);
  assert.equal(cuerpo.correo_avisos, "avisos@ejemplo.es");
  assert.equal(cuerpo.telegram, "pendiente");
  assert.equal(cuerpo.push_activado, false);
  assert.equal(cuerpo.instagram, null);
  assert.match(cuerpo.mensaje, /corredor@ejemplo.es/);
  assert.match(cuerpo.mensaje, /Avisos: avisos@ejemplo.es/);
  assert.match(cuerpo.mensaje, /Telegram: pendiente/);
  assert.match(cuerpo.mensaje, /Push: no/);
  assert.equal(cuerpo.chat_id, TELEGRAM_CHAT_ID_POR_DEFECTO);
});

test("la prueba no emite y el texto va marcado", () => {
  const cuerpo = cuerpoWebhook("telegram", AVISO, true, {});
  assert.equal(cuerpo.ok_emitir, false);
  assert.equal(cuerpo.confirmar, false);
  assert.equal(cuerpo.prueba, true);
  assert.equal(cuerpo.id_dedup, "registro-user-1");
  assert.match(cuerpo.mensaje, /^\[PRUEBA\]/);
  assert.equal(cuerpo.mensaje.includes("corredor@ejemplo.es"), false);
  assert.equal(cuerpo.mensaje.includes("avisos@ejemplo.es"), false);
  assert.equal(cuerpo.telegram, "pendiente");
  assert.equal(cuerpo.push_activado, false);
});

test("telegram conectado y push sí salen en el aviso", () => {
  const texto = mensajeRegistro({ ...AVISO, telegram: "conectado", pushActivado: true }, false);
  assert.match(texto.mensaje, /Telegram: conectado/);
  assert.match(texto.mensaje, /Push: sí/);
});

test("el push repite asunto y mensaje como title y body", () => {
  const cuerpo = cuerpoWebhook("push", AVISO, false, {});
  assert.equal(cuerpo.confirmar, true);
  assert.equal(cuerpo.title, cuerpo.asunto);
  assert.equal(cuerpo.body, cuerpo.mensaje);
  assert.equal("id_dedup" in cuerpo, false);
});

test("sin variables se llama a los tres webhooks genéricos", async () => {
  const urls: string[] = [];
  const resultados = await notificarAdminRegistro(AVISO, {
    env: {},
    fetchImpl: async (url) => {
      urls.push(String(url));
      return new Response("ok", { status: 200 });
    },
  });
  assert.deepEqual(urls, [WEBHOOKS_N8N.telegram, WEBHOOKS_N8N.push, WEBHOOKS_N8N.email]);
  assert.deepEqual(
    resultados.map((item) => item.estado),
    ["enviado", "enviado", "enviado"],
  );
});

test("la prueba contra webhooks manda ok_emitir y confirmar en false", async () => {
  const cuerpos: Array<{
    url: string;
    cuerpo: {
      ok_emitir: boolean;
      confirmar: boolean;
      canal: string;
      mensaje: string;
      id_dedup?: string;
      to?: string;
      copy?: string;
      html?: string;
      body?: string;
      title?: string;
      asunto?: string;
    };
  }> = [];
  const resultados = await notificarAdminRegistro(AVISO, {
    prueba: true,
    env: {
      ALERTAS_WEBHOOK_TELEGRAM: "https://avisos.example/telegram",
      ALERTAS_WEBHOOK_EMAIL: "https://avisos.example/email",
      ALERTAS_WEBHOOK_PUSH: "https://avisos.example/push",
    },
    fetchImpl: async (url, init) => {
      cuerpos.push({
        url: String(url),
        cuerpo: JSON.parse(String(init?.body)) as (typeof cuerpos)[number]["cuerpo"],
      });
      return new Response("ok", { status: 200 });
    },
  });
  assert.equal(resultados.every((item) => item.estado === "enviado"), true);
  assert.deepEqual(
    cuerpos.map((item) => item.cuerpo.canal),
    ["telegram", "push", "email"],
  );
  assert.equal(cuerpos.every((item) => item.cuerpo.ok_emitir === false), true);
  assert.equal(cuerpos.every((item) => item.cuerpo.confirmar === false), true);
  assert.equal(cuerpos.every((item) => item.cuerpo.mensaje.startsWith("[PRUEBA]")), true);
  const telegram = cuerpos[0]?.cuerpo;
  const push = cuerpos[1]?.cuerpo;
  const email = cuerpos[2]?.cuerpo;
  assert.equal(telegram?.id_dedup, "registro-user-1");
  assert.equal(push?.title, push?.asunto);
  assert.equal(push?.body, push?.mensaje);
  assert.equal(email?.id_dedup, "registro-user-1");
  assert.equal(email?.to, "avilesia2026@gmail.com");
  assert.equal(email?.copy, email?.mensaje);
  assert.equal(email?.html, email?.mensaje);
  assert.equal(email?.body, email?.mensaje);
});

test("un http no cuenta como webhook ni cae al genérico", async () => {
  const urls: string[] = [];
  const [telegram] = await notificarAdminRegistro(AVISO, {
    env: { ALERTAS_WEBHOOK_TELEGRAM: "http://avisos.example/telegram" },
    fetchImpl: async (url) => {
      urls.push(String(url));
      return new Response(null, { status: 200 });
    },
  });
  assert.deepEqual(urls, [WEBHOOKS_N8N.push, WEBHOOKS_N8N.email]);
  assert.equal(telegram?.estado, "omitido");
  assert.equal(telegram?.motivo, "sin_webhook");
});

test("sin webhook, el token de Telegram usa el chat admin y no se inventa un bot", async () => {
  let urlEnviada = "";
  let cuerpo: { chat_id?: string; text?: string } = {};
  const [telegram] = await notificarAdminRegistro(AVISO, {
    prueba: true,
    env: {
      ALERTAS_WEBHOOK_TELEGRAM: "http://avisos.example/telegram",
      ALERTAS_WEBHOOK_EMAIL: "http://avisos.example/email",
      ALERTAS_WEBHOOK_PUSH: "http://avisos.example/push",
      TELEGRAM_BOT_TOKEN: "token-de-prueba",
    },
    fetchImpl: async (url, init) => {
      urlEnviada = String(url);
      cuerpo = JSON.parse(String(init?.body)) as { chat_id?: string; text?: string };
      return new Response("ok", { status: 200 });
    },
  });
  assert.equal(telegram?.estado, "enviado");
  assert.equal(urlEnviada.startsWith("https://api.telegram.org/bot"), true);
  assert.equal(cuerpo.chat_id, TELEGRAM_CHAT_ID_POR_DEFECTO);
  assert.match(cuerpo.text ?? "", /^\[PRUEBA\]/);
});

test("con ALERTAS_TELEGRAM_WEBHOOK_TOKEN el Telegram va a la ruta con cabecera", async () => {
  const llamadas: { url: string; cabecera: string | null }[] = [];
  await notificarAdminRegistro(AVISO, {
    env: { ALERTAS_TELEGRAM_WEBHOOK_TOKEN: "secreto-de-prueba" },
    fetchImpl: async (url, init) => {
      llamadas.push({ url: String(url), cabecera: new Headers(init?.headers).get("x-n8n-generico-token") });
      return new Response("ok", { status: 200 });
    },
  });
  assert.deepEqual(llamadas[0], { url: WEBHOOKS_N8N.telegramCabecera, cabecera: "secreto-de-prueba" });
  // Push y correo también llevan la cabecera (misma credencial n8n).
  assert.equal(llamadas[1].cabecera, "secreto-de-prueba");
  assert.equal(llamadas[2].cabecera, "secreto-de-prueba");
});

test("ALERTAS_N8N_WEBHOOK_TOKEN tiene prioridad para push y correo; sin token no se manda cabecera", async () => {
  const llamadas: { url: string; cabecera: string | null }[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    llamadas.push({ url: String(url), cabecera: new Headers(init?.headers).get("x-n8n-generico-token") });
    return new Response("{}", { status: 200 });
  };
  await notificarAdminRegistro(AVISO, {
    env: { ALERTAS_TELEGRAM_WEBHOOK_TOKEN: "tg", ALERTAS_N8N_WEBHOOK_TOKEN: "gen" },
    fetchImpl,
  });
  const porUrl = Object.fromEntries(llamadas.map((l) => [l.url, l.cabecera]));
  assert.equal(porUrl[WEBHOOKS_N8N.telegramCabecera], "tg");
  assert.equal(porUrl[WEBHOOKS_N8N.push], "gen");
  assert.equal(porUrl[WEBHOOKS_N8N.email], "gen");
  llamadas.length = 0;
  await notificarAdminRegistro(AVISO, { env: {}, fetchImpl });
  assert.ok(llamadas.every((l) => l.cabecera === null));
});
