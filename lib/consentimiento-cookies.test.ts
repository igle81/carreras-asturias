import { test } from "node:test";
import assert from "node:assert/strict";
import { debeMostrarBannerPropio, guardarDecisionCookies } from "./consentimiento-cookies";
import { COOKIE_CONSENT_KEY, parseCookieConsent } from "./legal";

function almacen() {
  const m = new Map<string, string>();
  return { m, setItem: (k: string, v: string) => void m.set(k, v) };
}

test("Rechazar guarda marketing:false y el banner no vuelve a salir", () => {
  const a = almacen();
  guardarDecisionCookies(a, COOKIE_CONSENT_KEY, false);
  const d = parseCookieConsent(a.m.get(COOKIE_CONSENT_KEY) ?? null);
  assert.ok(d);
  assert.equal(d.marketing, false);
  assert.equal(d.analytics, false);
  assert.equal(debeMostrarBannerPropio({ googleFc: false, tieneDecision: Boolean(d), reabierto: false }), false);
});

test("Aceptar guarda marketing:true", () => {
  const a = almacen();
  guardarDecisionCookies(a, COOKIE_CONSENT_KEY, true);
  assert.equal(parseCookieConsent(a.m.get(COOKIE_CONSENT_KEY) ?? null)?.marketing, true);
});

test("Configurar cookies reabre aunque haya decisión", () => {
  assert.equal(debeMostrarBannerPropio({ googleFc: false, tieneDecision: true, reabierto: true }), true);
});
