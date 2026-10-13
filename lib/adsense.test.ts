import assert from "node:assert/strict";
import { test } from "node:test";
import { ADSENSE_CLIENT, indiceAnuncioEntreTarjetas, slotAnuncioInfeed } from "./adsense";

test("el client de AdSense es el publicado", () => {
  assert.equal(ADSENSE_CLIENT, "ca-pub-5660728155340779");
});

test("sin slot no hay anuncio", () => {
  assert.equal(slotAnuncioInfeed({}), null);
  assert.equal(slotAnuncioInfeed({ NEXT_PUBLIC_ADSENSE_SLOT: "" }), null);
  assert.equal(slotAnuncioInfeed({ NEXT_PUBLIC_ADSENSE_SLOT: "   " }), null);
});

test("el slot sale de la variable, sin inventar otro", () => {
  assert.equal(slotAnuncioInfeed({ NEXT_PUBLIC_ADSENSE_SLOT: " 1234567890 " }), "1234567890");
});

test("el anuncio solo cabe entre tarjetas", () => {
  assert.equal(indiceAnuncioEntreTarjetas(0), null);
  assert.equal(indiceAnuncioEntreTarjetas(1), null);
  assert.equal(indiceAnuncioEntreTarjetas(2), 1);
  assert.equal(indiceAnuncioEntreTarjetas(3), 1);
  assert.equal(indiceAnuncioEntreTarjetas(6), 3);
});
