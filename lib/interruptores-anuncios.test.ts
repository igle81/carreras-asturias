import assert from "node:assert/strict";
import test from "node:test";
import { frasePermitida, normalizarInterruptores, pedirInterruptores, RESPALDO } from "./interruptores-anuncios";

test("respaldo seguro: Decathlon y Amazon off, AdSense on", () => {
  assert.deepEqual(RESPALDO, { decathlon: false, amazon: false, adsense: true });
  assert.deepEqual(normalizarInterruptores(null), RESPALDO);
  assert.deepEqual(normalizarInterruptores([]), RESPALDO);
  assert.deepEqual(normalizarInterruptores([{ decathlon: "si" }]), RESPALDO);
});

test("lee la fila de Supabase", () => {
  assert.deepEqual(normalizarInterruptores([{ decathlon: true, amazon: false, adsense: false }]), {
    decathlon: true,
    amazon: false,
    adsense: false,
  });
});

test("si la petición falla o responde error, aplica el respaldo", async () => {
  const roto = (async () => {
    throw new Error("red");
  }) as unknown as typeof fetch;
  assert.deepEqual(await pedirInterruptores("pre", { fetchImpl: roto }), RESPALDO);
  const e500 = (async () => new Response("x", { status: 500 })) as unknown as typeof fetch;
  assert.deepEqual(await pedirInterruptores("pro", { fetchImpl: e500 }), RESPALDO);
});

test("los textos legales siguen el estado", () => {
  const off = { decathlon: false, amazon: false, adsense: false };
  assert.equal(frasePermitida("Enlaces de Decathlon por Awin", off), false);
  assert.equal(frasePermitida("Afiliado de Amazon", off), false);
  assert.equal(frasePermitida("Google AdSense", off), false);
  assert.equal(frasePermitida("Vercel aloja la web", off), true);
  assert.equal(frasePermitida("Enlaces de Decathlon", { ...off, decathlon: true }), true);
});
