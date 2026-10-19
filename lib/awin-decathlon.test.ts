import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AWIN_DECATHLON_MID,
  AWIN_EDITOR_ID,
  DESTINOS_CICLISMO,
  DESTINOS_DECATHLON,
  DESTINOS_PIE,
  REL_AFILIADO,
  enlaceAwinDecathlon,
  esUrlDecathlon,
} from "./awin-decathlon";

test("usa el editor 3128193 y el anunciante Decathlon ES 105405", () => {
  assert.equal(AWIN_EDITOR_ID, "3128193");
  assert.equal(AWIN_DECATHLON_MID, "105405");
  const href = new URL(enlaceAwinDecathlon("https://www.decathlon.es/es/deportes/running/ropa"));
  assert.equal(href.origin + href.pathname, "https://www.awin1.com/cread.php");
  assert.equal(href.searchParams.get("awinmid"), "105405");
  assert.equal(href.searchParams.get("awinaffid"), "3128193");
});

test("ued va codificado con encodeURIComponent y se recupera igual", () => {
  const destino = "https://www.decathlon.es/es/deportes/running/ropa?a=1&b=dos tres#x";
  const href = enlaceAwinDecathlon(destino);
  assert.ok(href.endsWith(`&ued=${encodeURIComponent(destino)}`));
  assert.ok(href.includes("ued=https%3A%2F%2Fwww.decathlon.es%2F"));
  assert.equal(href.split("ued=")[1].includes("&"), false, "el & del destino no rompe la query");
  assert.equal(new URL(href).searchParams.get("ued"), destino);
});

test("solo admite destinos https de www.decathlon.es", () => {
  assert.equal(esUrlDecathlon("https://www.decathlon.es/es/"), true);
  assert.equal(esUrlDecathlon("http://www.decathlon.es/es/"), false);
  assert.equal(esUrlDecathlon("https://www.decathlon.es.example.com/"), false);
  assert.equal(esUrlDecathlon("https://evil.test/?u=www.decathlon.es"), false);
  assert.equal(esUrlDecathlon("no es url"), false);
  assert.throws(() => enlaceAwinDecathlon("https://evil.test/"));
});

test("los destinos son categorías de decathlon.es y encajan por modalidad", () => {
  for (const d of Object.values(DESTINOS_DECATHLON)) {
    assert.equal(esUrlDecathlon(d.url), true, d.id);
    assert.match(d.url, /^https:\/\/www\.decathlon\.es\/es\/deportes\//);
  }
  assert.ok(DESTINOS_PIE.length >= 1 && DESTINOS_PIE.length <= 3);
  assert.ok(DESTINOS_CICLISMO.length >= 1 && DESTINOS_CICLISMO.length <= 3);
  assert.equal(DESTINOS_PIE.includes("ciclismo-carretera"), false);
});

test("rel del enlace patrocinado", () => {
  assert.equal(REL_AFILIADO, "sponsored nofollow noopener");
});
