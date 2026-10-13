import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  COLOR_FOG,
  COLOR_GOLD,
  COLOR_GOLD_TEXT,
  COLOR_INK,
  cumpleAaTexto,
  ratioContraste,
} from "./contraste";

test("gold-text sobre fog cumple AA (≥4.5:1)", () => {
  const ratio = ratioContraste(COLOR_GOLD_TEXT, COLOR_FOG);
  assert.ok(ratio >= 4.5, `ratio ${ratio}`);
  assert.equal(cumpleAaTexto(COLOR_GOLD_TEXT, COLOR_FOG), true);
});

test("el dorado de marca #E0B44A no cumple AA como texto sobre fog", () => {
  assert.equal(cumpleAaTexto(COLOR_GOLD, COLOR_FOG), false);
});

test("Pronto: tinta sobre dorado del botón cumple AA", () => {
  assert.ok(ratioContraste(COLOR_INK, COLOR_GOLD) >= 4.5);
});

test("AvilesIA usa text-gold-text sobre pastilla fog", () => {
  const src = readFileSync(join(process.cwd(), "components/avilesia-barra.tsx"), "utf8");
  assert.match(src, /text-gold-text/);
  assert.match(src, /bg-fog/);
  assert.doesNotMatch(src, /mr-1 font-display text-sm font-black tracking-tight text-gold/);
});

test("Pronto ya no usa text-ink/70", () => {
  const src = readFileSync(join(process.cwd(), "components/vip-promo.tsx"), "utf8");
  assert.match(src, /Pronto/);
  assert.equal(src.includes("text-ink/70"), false);
  assert.match(src, /tracking-wide text-ink/);
});

test("globals define gold-text sin cambiar gold", () => {
  const src = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  assert.match(src, /--color-gold:\s*#e0b44a/i);
  assert.match(src, /--color-gold-text:\s*#7a5c10/i);
});
