import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../components/home-view.tsx", import.meta.url), "utf8");
const nearby = readFileSync(new URL("../components/nearby-section.tsx", import.meta.url), "utf8");

test("/correr renderiza el listado en servidor (sin montaje diferido por scroll)", () => {
  assert.match(home, /import \{ NearbySection \} from "\.\/nearby-section"/);
  assert.doesNotMatch(home, /AlVer|NearbySectionDiferida/);
  assert.match(home, /<NearbySection /);
});

test("listado incluye ancla #mapa, «Ver mapa», «Ver más» y filtro de concejo", () => {
  assert.match(nearby, /id="mapa"/);
  assert.match(nearby, />\s*Ver mapa\s*</);
  assert.match(nearby, />\s*Ver más\s*</);
  assert.match(nearby, /<ConcejoSelect /);
});

test("Leaflet solo se carga al pulsar (dynamic ssr:false tras verMapa)", () => {
  assert.match(nearby, /dynamic\(\s*\(\) => import\("\.\/mapa-carreras"\)/);
  assert.match(nearby, /ssr: false/);
  assert.match(nearby, /verMapa \?/);
});

test("«Ver en el mapa» abre el mapa sin esperar al scroll y baja a #mapa", () => {
  const mapa = readFileSync(new URL("../components/mapa-carreras.tsx", import.meta.url), "utf8");
  assert.match(nearby, /setIrAlMapa\(/);
  assert.match(nearby, /scrollIntoView\(/);
  assert.match(nearby, /querySelector\("\.leaflet-container"\)/);
  assert.match(nearby, /inmediato=\{irAlMapa > 0\}/);
  assert.match(mapa, /useState\(inmediato\)/);
});

test("«Ver en el mapa» con fondo sólido y texto oscuro (≥4,5:1)", () => {
  assert.doesNotMatch(nearby, /text-atlantic hover:text-forest"/);
  assert.match(nearby, /bg-white[^"]*text-\[#0b4f5c\]/);
});

test("aviso de respaldo con temporizador propio y Funding Choices tras load", () => {
  const banner = readFileSync(new URL("../components/cookie-banner.tsx", import.meta.url), "utf8");
  const ads = readFileSync(new URL("../components/adsense-consent.tsx", import.meta.url), "utf8");
  assert.match(banner, /RESPALDO_DESDE_CARGA_MS = 4750/);
  assert.doesNotMatch(banner, /ca-fc-inyectado/);
  assert.match(ads, /addEventListener\("load", trasLoad/);
  assert.match(ads, /IDLE_TIMEOUT_MS = 4000/);
});

test("«Ver en el mapa» va dentro del pie de la tarjeta, junto a «Ficha»", () => {
  const card = readFileSync(new URL("../components/event-card.tsx", import.meta.url), "utf8");
  assert.match(nearby, /accion=\{/);
  assert.match(card, /Ficha\s*<\/Link>\s*\{accion\}/);
});

test("el respaldo de cookies se monta con su propio temporizador, no tras load/idle", () => {
  const dif = readFileSync(new URL("../components/diferidos.tsx", import.meta.url), "utf8");
  assert.match(dif, /bannerListo \? <CookieBanner \/>/);
});

test("sin content-visibility en las secciones con tarjetas (solapes en axe)", () => {
  assert.doesNotMatch(home, /className="cv-auto"/);
});
