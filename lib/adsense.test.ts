import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  ADSENSE_ACCOUNT_META,
  ADSENSE_CLIENT,
  consentimientoRespaldo,
  indiceAnuncioEntreTarjetas,
  requiereCargaCompleta,
  slotAnuncioInfeed,
  tcfPermiteAnuncios,
} from "./adsense";

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

test("el respaldo nunca concede ad_personalization ni ad_user_data", () => {
  const c = consentimientoRespaldo();
  assert.equal(c.ad_personalization, "denied");
  assert.equal(c.ad_user_data, "denied");
  assert.equal(c.ad_storage, "denied");
  assert.equal(c.analytics_storage, "denied");
});

test("de pública a zona privada hay carga completa", () => {
  for (const r of ["/avisos", "/registro", "/acceso", "/interno", "/alertas/confirmar", "/vip"]) {
    assert.equal(requiereCargaCompleta("/", r), true, r);
  }
  assert.equal(requiereCargaCompleta("/", "/correr"), false);
  assert.equal(requiereCargaCompleta("/registro", "/avisos"), false);
  assert.equal(requiereCargaCompleta("/", "/vipers"), false);
});

test("TCF: solo con decisión y propósito 1 se cargan anuncios", () => {
  assert.equal(tcfPermiteAnuncios(null), false);
  assert.equal(tcfPermiteAnuncios({ eventStatus: "cmpuishown", tcString: "x", purpose: { consents: { "1": true } } }), false);
  assert.equal(tcfPermiteAnuncios({ eventStatus: "useractioncomplete", tcString: "x", purpose: { consents: { "1": false } } }), false);
  assert.equal(tcfPermiteAnuncios({ eventStatus: "useractioncomplete", tcString: "x", purpose: { consents: { "1": true } } }), true);
  assert.equal(tcfPermiteAnuncios({ eventStatus: "tcloaded", tcString: "", purpose: { consents: { "1": true } } }), false);
});

const raiz = join(__dirname, "..");

test("la meta google-adsense-account lleva el client publicado", () => {
  assert.deepEqual(ADSENSE_ACCOUNT_META, { "google-adsense-account": "ca-pub-5660728155340779" });
});

test("el layout publica la meta una sola vez vía metadata.other", () => {
  const layout = readFileSync(join(raiz, "app/layout.tsx"), "utf8");
  assert.equal(layout.match(/other:\s*\{\s*\.\.\.ADSENSE_ACCOUNT_META\s*\}/g)?.length, 1);
  assert.ok(!layout.includes('name="google-adsense-account"'), "sin <meta> a mano duplicada");
  assert.ok(layout.includes("CONSENT_DEFAULT_SCRIPT"), "el consentimiento por defecto sigue en el <head>");
});

test("ads.txt sigue publicado con la cuenta de AdSense", () => {
  const ads = readFileSync(join(raiz, "public/ads.txt"), "utf8");
  assert.match(ads, /^google\.com, pub-5660728155340779, DIRECT, f08c47fec0942fa0$/m);
});
