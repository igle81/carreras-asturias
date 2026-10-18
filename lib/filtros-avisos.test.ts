import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  alternarValores,
  avisoPasaFiltros,
  kmsDeEvento,
  normalizarFiltros,
  opcionesFiltros,
  resumenFiltros,
  sinFiltros,
} from "./filtros-avisos";
import { LEGAL_DOCUMENTS } from "./legal";

const trailTineo = {
  modalidad: "pie",
  disciplina_normalizada: "trail",
  municipio: "Tineo",
  municipio_meta: null,
  distancias: [{ km: 23.5 }, { km: 10 }],
};
const mtbGrado = { modalidad: "ciclismo", disciplina_normalizada: "mtb", municipio: "Grado", municipio_meta: null, distancias: [{ km: 106 }] };

test("sin filtros llega todo (no se corta a los actuales)", () => {
  assert.equal(sinFiltros({}), true);
  for (const tipo of ["vispera", "dia", "clasif", "clasif_sin_resultado"]) {
    assert.equal(avisoPasaFiltros({}, tipo, trailTineo), true);
    assert.equal(avisoPasaFiltros(normalizarFiltros(null), tipo, mtbGrado), true);
  }
});

test("tipo, deporte, modalidad y concejo", () => {
  assert.equal(avisoPasaFiltros({ tipo: ["clasificaciones"] }, "vispera", trailTineo), false);
  assert.equal(avisoPasaFiltros({ tipo: ["clasificaciones"] }, "clasif", trailTineo), true);
  assert.equal(avisoPasaFiltros({ deporte: ["ciclismo"] }, "dia", trailTineo), false);
  assert.equal(avisoPasaFiltros({ deporte: ["ciclismo"] }, "dia", mtbGrado), true);
  assert.equal(avisoPasaFiltros({ modalidad: ["asfalto"] }, "dia", trailTineo), false);
  assert.equal(avisoPasaFiltros({ concejo: ["tineo"] }, "dia", trailTineo), true);
  assert.equal(avisoPasaFiltros({ concejo: ["Gijón"] }, "dia", trailTineo), false);
});

test("si a la carrera le falta el dato, el aviso llega igual; la prueba nunca se filtra", () => {
  const sinDatos = { modalidad: null, disciplina_normalizada: null, municipio: null, municipio_meta: null, distancias: null };
  assert.equal(avisoPasaFiltros({ deporte: ["pie"], modalidad: ["trail"], concejo: ["Avilés"], distancia: ["corta"] }, "dia", sinDatos), true);
  assert.equal(avisoPasaFiltros({ tipo: ["apertura"] }, "prueba", null), true);
});

test("distancia: rangos a pie y ciclismo sin filtrar por km", () => {
  assert.equal(avisoPasaFiltros({ distancia: ["larga"] }, "dia", trailTineo), true);
  assert.equal(avisoPasaFiltros({ distancia: ["media"] }, "dia", trailTineo), true);
  assert.equal(avisoPasaFiltros({ distancia: ["corta"] }, "dia", trailTineo), false);
  assert.equal(avisoPasaFiltros({ distancia: ["corta"] }, "dia", { ...trailTineo, distancias: [{ km: 21.0975 }] }), false);
  assert.equal(avisoPasaFiltros({ distancia: ["media"] }, "dia", { ...trailTineo, distancias: [{ km: 21.0975 }] }), true);
  assert.equal(avisoPasaFiltros({ distancia: ["corta"] }, "dia", mtbGrado), true);
  assert.deepEqual(kmsDeEvento("10k"), [10]);
  assert.deepEqual(kmsDeEvento([{ km: 5 }, { etiqueta: "x" }]), [5]);
});

test("normalizar descarta claves y valores no válidos (como el CHECK de Supabase)", () => {
  assert.deepEqual(
    normalizarFiltros({ deporte: ["pie", "natacion"], tipo: [], otra: ["x"], modalidad: ["Trail!", "trail"], distancia: ["larga", 3] }),
    { deporte: ["pie"], modalidad: ["trail"], distancia: ["larga"] },
  );
  assert.deepEqual(normalizarFiltros([]), {});
});

test("opciones solo con valores reales y modalidades agrupadas por etiqueta", () => {
  const o = opcionesFiltros([
    { modalidad: "pie", disciplina_normalizada: "trail", municipio: "Tineo" },
    { modalidad: "ciclismo", disciplina_normalizada: "mtb", municipio: "Grado" },
    { modalidad: "ciclismo", disciplina_normalizada: "btt", municipio: "Grado" },
    { modalidad: "pie", disciplina_normalizada: null, municipio: null },
  ]);
  assert.deepEqual(o.deporte.map((d) => d.id), ["pie", "ciclismo"]);
  const bici = o.modalidad.find((m) => m.deporte === "ciclismo")!;
  assert.deepEqual(bici.opciones, [{ id: "btt+mtb", label: "MTB/BTT", valores: ["btt", "mtb"] }]);
  assert.deepEqual(o.concejo.map((c) => c.id), ["Grado", "Tineo"]);
  const f = alternarValores({}, "modalidad", ["btt", "mtb"], true);
  assert.deepEqual(f, { modalidad: ["btt", "mtb"] });
  assert.deepEqual(alternarValores(f, "modalidad", ["btt", "mtb"], false), {});
});

test("resumen de la tarjeta", () => {
  assert.equal(resumenFiltros({}), "Recibes todos los avisos.");
  assert.match(resumenFiltros({ deporte: ["pie"], tipo: ["clasificaciones"] }), /a pie · solo clasificaciones/);
});

const SQL = readFileSync(new URL("../supabase/migrations/20261018223301_carreras_filtros_avisos.sql", import.meta.url), "utf8");
const KMS = readFileSync(new URL("../supabase/migrations/20261018223346_carreras_filtros_avisos_kms.sql", import.meta.url), "utf8");

test("Supabase: columna con {} por defecto, CHECK, grant solo de esa columna y RPC solo service_role", () => {
  assert.match(SQL, /add column if not exists filtros_avisos jsonb not null default '\{\}'::jsonb/);
  assert.match(SQL, /check \(carreras\.filtros_avisos_validos\(filtros_avisos\)\)/);
  assert.match(SQL, /grant update \(filtros_avisos\) on carreras\.suscripciones_alertas to authenticated;/);
  assert.match(SQL, /revoke all on function carreras\.avisos_destinatarios_filtrados\(jsonb\) from public, anon, authenticated;/);
  assert.match(SQL, /grant execute on function carreras\.avisos_destinatarios_filtrados\(jsonb\) to service_role;/);
  assert.match(SQL, /from carreras\.avisos_destinatarios\(\) d/);
  assert.match(SQL, /p_tipo = 'prueba'/);
  // mismos rangos que DISTANCIAS
  assert.match(SQL, /'corta' = any \(lista\) and k < 10/);
  assert.match(SQL, /'media' = any \(lista\) and k >= 10 and k <= 21\.1/);
  assert.match(SQL, /'larga' = any \(lista\) and k > 21\.1/);
  assert.match(KMS, /\(\?:\[\.,\]\[0-9\]\+\)\?/);
});

test("Privacidad menciona los filtros", () => {
  assert.match(JSON.stringify(LEGAL_DOCUMENTS.privacidad), /tus filtros de avisos/);
});
