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
