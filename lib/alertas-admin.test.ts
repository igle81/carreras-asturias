import assert from "node:assert/strict";
import { test } from "node:test";
import { cuerpoWebhook, idCorto, mensajeRegistro, notificarAdminRegistro, WEBHOOKS_N8N } from "./alertas-admin";

const ADMIN = "avilesia2026@gmail.com";

const AVISO = {
  email: "corredor@ejemplo.es",
  userId: "00000000-0000-4000-8000-000000000001",
  correoAvisos: "avisos@ejemplo.es",
  telegram: "pendiente" as const,
  pushActivado: false,
};

test("un alta real pide emitir y el correo lleva el texto en los campos de n8n", () => {
  const cuerpo = cuerpoWebhook(AVISO, false, {});
  assert.equal(cuerpo.canal, "email");
  assert.equal(cuerpo.ok_emitir, true);
  assert.equal(cuerpo.confirmar, true);
  assert.equal(cuerpo.prueba, false);
  assert.equal(cuerpo.id_dedup, "registro-00000000");
  assert.equal(cuerpo.to, ADMIN);
  assert.equal(cuerpo.asunto, "Nuevo registro de avisos · Carreras Asturias");
  assert.equal(cuerpo.copy, cuerpo.mensaje);
  assert.equal(cuerpo.html, cuerpo.mensaje);
  assert.equal(cuerpo.body, cuerpo.mensaje);
  assert.match(cuerpo.mensaje, /Correo: corredor@ejemplo.es/);
  assert.match(cuerpo.mensaje, /Avisos: avisos@ejemplo.es/);
  assert.match(cuerpo.mensaje, /Id: 00000000/);
  assert.match(cuerpo.mensaje, /Telegram: pendiente/);
  assert.match(cuerpo.mensaje, /Push: no/);
});

test("N1: lo que va a n8n no lleva nombre, Instagram, chat de Telegram ni campos sueltos con el correo", () => {
  const cuerpo = cuerpoWebhook(AVISO, false, {}) as Record<string, unknown>;
  for (const campo of ["nombre", "instagram", "correo_usuario", "correo_avisos", "user_id", "chat_id", "external_id"]) {
    assert.equal(campo in cuerpo, false, campo);
  }
  const sinTexto = JSON.stringify({ ...cuerpo, mensaje: "", copy: "", html: "", body: "" });
  assert.equal(sinTexto.includes("corredor@ejemplo.es"), false);
  assert.equal(sinTexto.includes(AVISO.userId), false);
});

test("si el correo de avisos es el mismo no se repite y el texto va escapado", () => {
  const mismo = mensajeRegistro({ ...AVISO, correoAvisos: "Corredor@Ejemplo.es" }, false);
  assert.match(mismo.mensaje, /Avisos: el mismo\./);
  const raro = mensajeRegistro({ ...AVISO, email: "a<b>@x.es", correoAvisos: "a<b>@x.es" }, false);
  assert.equal(raro.mensaje.includes("<b>"), false);
  assert.equal(idCorto(AVISO.userId), "00000000");
});

test("la prueba no emite y el texto va marcado", () => {
  const cuerpo = cuerpoWebhook(AVISO, true, {});
  assert.equal(cuerpo.ok_emitir, false);
  assert.equal(cuerpo.confirmar, false);
  assert.equal(cuerpo.prueba, true);
  assert.match(cuerpo.mensaje, /^\[PRUEBA\]/);
  assert.equal(cuerpo.mensaje.includes("corredor@ejemplo.es"), false);
});

test("telegram conectado y push sí salen en el email", () => {
  const texto = mensajeRegistro({ ...AVISO, telegram: "conectado", pushActivado: true }, false);
  assert.match(texto.mensaje, /Telegram: conectado/);
  assert.match(texto.mensaje, /Push: sí/);
});

test("N1: solo se llama al webhook de email, nunca a Telegram ni a push, aunque haya variables antiguas", async () => {
  const urls: string[] = [];
  const resultados = await notificarAdminRegistro(AVISO, {
    env: {
      ALERTAS_WEBHOOK_TELEGRAM: "https://avisos.example/telegram",
      ALERTAS_WEBHOOK_PUSH: "https://avisos.example/push",
      ALERTAS_TELEGRAM_CHAT_ID: "-100123",
      ALERTAS_TELEGRAM_WEBHOOK_TOKEN: "secreto-de-prueba",
      TELEGRAM_BOT_TOKEN: "token-de-prueba",
      ONESIGNAL_REST_API_KEY: "clave-de-prueba",
    },
    fetchImpl: async (url, init) => {
      urls.push(String(url));
      assert.equal(new Headers(init?.headers).get("x-n8n-generico-token"), "secreto-de-prueba");
      return new Response("ok", { status: 200 });
    },
  });
  assert.deepEqual(urls, [WEBHOOKS_N8N.email]);
  assert.deepEqual(resultados, [{ canal: "email", estado: "enviado" }]);
});

test("ALERTAS_WEBHOOK_EMAIL https sustituye al genérico y la prueba manda ok_emitir y confirmar en false", async () => {
  const llamadas: { url: string; cuerpo: { ok_emitir: boolean; confirmar: boolean; to: string } }[] = [];
  const resultados = await notificarAdminRegistro(AVISO, {
    prueba: true,
    env: { ALERTAS_WEBHOOK_EMAIL: "https://avisos.example/email" },
    fetchImpl: async (url, init) => {
      llamadas.push({ url: String(url), cuerpo: JSON.parse(String(init?.body)) });
      return new Response("ok", { status: 200 });
    },
  });
  assert.equal(resultados[0]?.estado, "enviado");
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0]?.url, "https://avisos.example/email");
  assert.equal(llamadas[0]?.cuerpo.ok_emitir, false);
  assert.equal(llamadas[0]?.cuerpo.confirmar, false);
  assert.equal(llamadas[0]?.cuerpo.to, ADMIN);
});

test("un http no cuenta como webhook y no se envía nada", async () => {
  const urls: string[] = [];
  const resultados = await notificarAdminRegistro(AVISO, {
    env: { ALERTAS_WEBHOOK_EMAIL: "http://avisos.example/email" },
    fetchImpl: async (url) => {
      urls.push(String(url));
      return new Response(null, { status: 200 });
    },
  });
  assert.deepEqual(urls, []);
  assert.deepEqual(resultados, [{ canal: "email", estado: "omitido", motivo: "sin_webhook" }]);
});

test("un fallo del webhook no lanza", async () => {
  const [error] = await notificarAdminRegistro(AVISO, { env: {}, fetchImpl: async () => new Response(null, { status: 500 }) });
  assert.deepEqual(error, { canal: "email", estado: "error", motivo: "http_500" });
  const [red] = await notificarAdminRegistro(AVISO, {
    env: {},
    fetchImpl: async () => {
      throw new Error("caído");
    },
  });
  assert.deepEqual(red, { canal: "email", estado: "error", motivo: "red" });
});

test("sin token no se manda la cabecera; ALERTAS_WEBHOOK_TOKEN tiene preferencia", async () => {
  const cabeceras: (string | null)[] = [];
  const fetchImpl = async (_url: string, init?: RequestInit) => {
    cabeceras.push(new Headers(init?.headers).get("x-n8n-generico-token"));
    return new Response("ok", { status: 200 });
  };
  await notificarAdminRegistro(AVISO, { env: {}, fetchImpl });
  await notificarAdminRegistro(AVISO, {
    env: { ALERTAS_WEBHOOK_TOKEN: "nuevo", ALERTAS_TELEGRAM_WEBHOOK_TOKEN: "antiguo" },
    fetchImpl,
  });
  assert.deepEqual(cabeceras, [null, "nuevo"]);
});
