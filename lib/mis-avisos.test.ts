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

test("al volver a recibir avisos por correo, Telegram queda desconectado (web y base)", async () => {
  const { readFileSync, readdirSync } = await import("node:fs");
  const src = readFileSync(new URL("../components/mis-avisos.tsx", import.meta.url), "utf8");
  const volver = src.slice(src.indexOf("async function volverARecibirCorreo"), src.indexOf("if (!listo)"));
  assert.match(volver, /rpc\(RPC_REACTIVAR_CORREO\)/);
  assert.match(volver, /setTelegram\(null\)/, "la pantalla no sigue mostrando el chat conectado");
  // La última migración que define avisos_reactivar_correo() borra la conexión de Telegram.
  const dir = new URL("../supabase/migrations/", import.meta.url);
  const ficheros = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().reverse();
  const marca = "create or replace function carreras.avisos_reactivar_correo";
  const fichero = ficheros.find((f) => readFileSync(new URL(f, dir), "utf8").includes(marca));
  assert.ok(fichero, "hay una migración que define avisos_reactivar_correo");
  const sql = readFileSync(new URL(fichero!, dir), "utf8");
  const def = sql.slice(sql.indexOf(marca));
  assert.match(def.slice(0, def.indexOf("$$;") > 0 ? def.indexOf("$$;") : undefined), /delete from carreras\.alertas_telegram/);
});
