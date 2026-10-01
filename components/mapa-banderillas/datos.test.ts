import assert from "node:assert/strict";
import { test } from "node:test";
import { diaIso, enlaceComoLlegar, enlaceSeguro, textoFecha, validarPuntos } from "./datos";
import { agrupar, colorSeguro } from "./nucleo";

test("se ignoran los puntos sin coordenadas válidas", () => {
  const r = validarPuntos([
    { nombre: "a" },
    { lat: null, lon: 1 },
    { lat: "x", lon: 1 },
    { lat: 91, lon: 0 },
    { lat: 0, lon: 181 },
    { lat: NaN, lon: 0 },
    null,
    3,
    "t",
    { lat: 43, lon: -5 },
  ]);
  assert.equal(r.validos.length, 1);
  assert.equal(r.descartados, 9);
});

test("acepta lng, números como texto y coma decimal; rellena lo que falta", () => {
  const [p] = validarPuntos([{ lat: "43,5", lng: "-5.8" }]).validos;
  assert.equal(p.lat, 43.5);
  assert.equal(p.lon, -5.8);
  assert.equal(p.nombre, "Sin nombre");
  assert.equal(p.categoria, "sin-categoria");
  assert.equal(p.fecha, null);
});

test("la fecha ISO se valida", () => {
  assert.equal(diaIso("2026-10-17"), "2026-10-17");
  assert.equal(diaIso("2026-10-17T10:30:00Z"), "2026-10-17");
  assert.equal(diaIso("2026-02-30"), null);
  assert.equal(diaIso("17/10/2026"), null);
  assert.equal(diaIso(undefined), null);
  assert.equal(textoFecha("2026-06-04", 2026), "jue 4 jun");
});

test("la ficha interna se conserva y se descarta javascript", () => {
  assert.equal(enlaceSeguro("javascript:alert(1)"), null);
  assert.equal(enlaceSeguro("https://example.org/x"), "https://example.org/x");
  assert.equal(enlaceSeguro("/evento/carrera-ejemplo-2026"), "/evento/carrera-ejemplo-2026");
  assert.equal(enlaceSeguro("//evil.example"), null);
  assert.equal(
    validarPuntos([{ lat: 1, lon: 1, enlace: "/evento/carrera-ejemplo-2026" }]).validos[0].enlace,
    "/evento/carrera-ejemplo-2026",
  );
});

test("las banderillas del mismo lugar se agrupan y la categoría más repetida manda", () => {
  const g = agrupar(
    validarPuntos([
      { lat: 43.1, lon: -5.1, categoria: "a" },
      { lat: 43.10001, lon: -5.10001, categoria: "b" },
      { lat: 43.1, lon: -5.1, categoria: "b" },
      { lat: 44, lon: -5 },
    ]).validos,
  );
  assert.equal(g.length, 2);
  assert.equal(g[0].puntos.length, 3);
  assert.equal(g[0].categoria, "b");
});

test("el color no admite nada que rompa el atributo de estilo", () => {
  assert.equal(colorSeguro("#0e5a4e", "x"), "#0e5a4e");
  assert.equal(colorSeguro("rgb(1 2 3 / 50%)", "x"), "rgb(1 2 3 / 50%)");
  assert.equal(colorSeguro('red;" onload="x', "x"), "x");
  assert.equal(colorSeguro(undefined, "x"), "x");
});

test("«Cómo llegar» no lleva clave y admite origen opcional", () => {
  const u = new URL(enlaceComoLlegar({ lat: 43.36, lon: -5.85 }));
  assert.equal(u.origin + u.pathname, "https://www.google.com/maps/dir/");
  assert.equal(u.searchParams.get("destination"), "43.36000,-5.85000");
  assert.equal(u.searchParams.get("origin"), null);
  assert.equal(new URL(enlaceComoLlegar({ lat: 1, lon: 2 }, "Gijón")).searchParams.get("origin"), "Gijón");
  assert.equal(
    new URL(enlaceComoLlegar({ lat: 1, lon: 2 }, { lat: 3, lon: 4 })).searchParams.get("origin"),
    "3.00000,4.00000",
  );
});
