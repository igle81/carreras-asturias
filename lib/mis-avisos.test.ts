import assert from "node:assert/strict";
import { test } from "node:test";
import { htmlBaja } from "./baja-avisos";
import { RPC_REACTIVAR_CORREO, TEXTO_VOLVER_CORREO, textoBotonTelegram, textoEstadoCorreo } from "./mis-avisos";

test("con Telegram conectado el botón no dice «Conectar Telegram»", () => {
  assert.equal(textoBotonTelegram(true), "Volver a conectar Telegram");
  assert.equal(textoBotonTelegram(false), "Conectar Telegram");
});

test("estado del correo con y sin baja", () => {
  assert.equal(textoEstadoCorreo("2026-10-18T22:03:00Z", "a@b.es"), "Los avisos por correo están de baja.");
  assert.equal(textoEstadoCorreo(null, "a@b.es"), "Te escribimos a a@b.es.");
  assert.equal(textoEstadoCorreo(null, null), "Te escribimos a tu correo.");
});

test("hay vuelta atrás tras la baja y se hace por la RPC limitada a auth.uid()", () => {
  assert.equal(TEXTO_VOLVER_CORREO, "Volver a recibir avisos por correo");
  assert.equal(RPC_REACTIVAR_CORREO, "avisos_reactivar_correo");
  // La página de baja ya no dice que haya que crear otra cuenta para volver.
  assert.doesNotMatch(htmlBaja("confirmar", null), /otra cuenta|definitiva/);
  assert.match(htmlBaja("confirmar", null), /Mis avisos/);
});
