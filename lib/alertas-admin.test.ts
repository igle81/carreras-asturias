import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cuerpoWebhook,
  notificarAdminRegistro,
  TELEGRAM_CHAT_ID_POR_DEFECTO,
} from "./alertas-admin";

const AVISO = { email: "corredor@ejemplo.es", userId: "user-1" };

test("un alta real pide emitir y nombra el correo", () => {
  const cuerpo = cuerpoWebhook("email", AVISO, false, {});
  assert.equal(cuerpo.ok_emitir, true);
  assert.equal(cuerpo.prueba, false);
  assert.match(cuerpo.mensaje, /corredor@ejemplo.es/);
  assert.equal(cuerpo.chat_id, TELEGRAM_CHAT_ID_POR_DEFECTO);
  assert.equal(cuerpo.correo_destino, "avilesia2026@gmail.com");
});

test("la prueba no emite y el texto va marcado", () => {
  const cuerpo = cuerpoWebhook("telegram", AVISO, true, {});
  assert.equal(cuerpo.ok_emitir, false);
  assert.equal(cuerpo.prueba, true);
  assert.match(cuerpo.mensaje, /^\[PRUEBA\]/);
  assert.equal(cuerpo.mensaje.includes("corredor@ejemplo.es"), false);
});

test("sin webhook ni token los tres canales quedan omitidos y no hay fetch", async () => {
  let llamadas = 0;
  const resultados = await notificarAdminRegistro(AVISO, {
    env: {},
    fetchImpl: async () => {
      llamadas += 1;
      return new Response(null, { status: 200 });
    },
  });
  assert.equal(llamadas, 0);
  assert.deepEqual(
    resultados.map((item) => item.estado),
    ["omitido", "omitido", "omitido"],
  );
  assert.deepEqual(
    resultados.map((item) => item.motivo),
    ["sin_webhook", "sin_webhook", "sin_webhook"],
  );
});

test("la prueba contra webhooks manda ok_emitir false en los tres canales", async () => {
  const cuerpos: Array<{ url: string; cuerpo: { ok_emitir: boolean; canal: string; mensaje: string } }> = [];
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
        cuerpo: JSON.parse(String(init?.body)) as { ok_emitir: boolean; canal: string; mensaje: string },
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
  assert.equal(cuerpos.every((item) => item.cuerpo.mensaje.startsWith("[PRUEBA]")), true);
});

test("un http no cuenta como webhook", async () => {
  let llamadas = 0;
  const [telegram] = await notificarAdminRegistro(AVISO, {
    env: { ALERTAS_WEBHOOK_TELEGRAM: "http://avisos.example/telegram" },
    fetchImpl: async () => {
      llamadas += 1;
      return new Response(null, { status: 200 });
    },
  });
  assert.equal(llamadas, 0);
  assert.equal(telegram?.estado, "omitido");
});

test("sin webhook, el token de Telegram usa el chat admin y no se inventa un bot", async () => {
  let urlEnviada = "";
  let cuerpo: { chat_id?: string; text?: string } = {};
  const [telegram] = await notificarAdminRegistro(AVISO, {
    prueba: true,
    env: { TELEGRAM_BOT_TOKEN: "token-de-prueba" },
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
