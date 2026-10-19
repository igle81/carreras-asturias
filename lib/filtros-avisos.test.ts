import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  CLAVES_FILTRO,
  DEPORTES,
  DISTANCIAS,
  TIPOS_AVISO,
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
  assert.equal(avisoPasaFiltros({ modalidad_pie: ["asfalto"] }, "dia", trailTineo), false);
  assert.equal(avisoPasaFiltros({ concejo: ["tineo"] }, "dia", trailTineo), true);
  assert.equal(avisoPasaFiltros({ concejo: ["Gijón"] }, "dia", trailTineo), false);
});

test("si a la carrera le falta el dato, el aviso llega igual; la prueba nunca se filtra", () => {
  const sinDatos = { modalidad: null, disciplina_normalizada: null, municipio: null, municipio_meta: null, distancias: null };
  assert.equal(avisoPasaFiltros({ deporte: ["pie"], modalidad_pie: ["trail"], concejo: ["Avilés"], distancia: ["corta"] }, "dia", sinDatos), true);
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
    normalizarFiltros({ deporte: ["pie", "natacion"], tipo: [], otra: ["x"], modalidad_pie: ["Trail!", "trail"], modalidad: ["trail"], distancia: ["larga", 3] }),
    { deporte: ["pie"], modalidad_pie: ["trail"], distancia: ["larga"] },
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
  const f = alternarValores({}, "modalidad_ciclismo", ["btt", "mtb"], true);
  assert.deepEqual(f, { modalidad_ciclismo: ["btt", "mtb"] });
  assert.deepEqual(alternarValores(f, "modalidad_ciclismo", ["btt", "mtb"], false), {});
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

test("un tipo de aviso nuevo (no elegible) se recibe aunque haya filtro de tipo", () => {
  assert.equal(avisoPasaFiltros({ tipo: ["apertura"] }, "cancelacion", trailTineo), true);
  assert.equal(avisoPasaFiltros({ tipo: ["apertura"] }, "clasif", trailTineo), false);
  const C1 = readFileSync(new URL("../supabase/migrations/20261018224933_carreras_consentimientos_reconstruidos.sql", import.meta.url), "utf8");
  assert.match(C1, /Tipo de aviso que no es apertura \(vispera\/dia\) ni clasificaciones \(clasif\*\) = pasa/);
});

test("F1: los filtros no pasan de 4096 bytes (como el CHECK)", () => {
  const muchos = Array.from({ length: 60 }, (_, i) => `Concejo de prueba número ${i} ${"x".repeat(40)}`);
  const f = normalizarFiltros({ concejo: muchos, tipo: ["apertura"] });
  assert.ok(new TextEncoder().encode(JSON.stringify(f)).length <= 4096);
  assert.ok(f.concejo!.length < 60);
  assert.deepEqual(f.tipo, ["apertura"]);
});

test("W1: marcar «Trail» y nada de ciclismo no corta el ciclismo", () => {
  const f = normalizarFiltros({ modalidad_pie: ["trail"] });
  assert.equal(avisoPasaFiltros(f, "dia", trailTineo), true);
  assert.equal(avisoPasaFiltros(f, "dia", { ...trailTineo, disciplina_normalizada: "asfalto" }), false);
  assert.equal(avisoPasaFiltros(f, "dia", mtbGrado), true);
  // salvo que el filtro a pie/ciclismo lo excluya
  assert.equal(avisoPasaFiltros({ ...f, deporte: ["pie"] }, "dia", mtbGrado), false);
  // y las modalidades de ciclismo solo cuentan para el ciclismo
  assert.equal(avisoPasaFiltros({ modalidad_ciclismo: ["btt"] }, "dia", mtbGrado), false);
  assert.equal(avisoPasaFiltros({ modalidad_ciclismo: ["btt"] }, "dia", trailTineo), true);
  const W1 = readFileSync(new URL("../supabase/migrations/20261018225338_carreras_filtros_modalidad_por_deporte.sql", import.meta.url), "utf8");
  assert.match(W1, /coalesce\(f -> \('modalidad_' \|\| e\.modalidad\), '\[\]'\)/);
});

test("el CHECK de Supabase admite exactamente las claves y valores del código", () => {
  const W1 = readFileSync(new URL("../supabase/migrations/20261018225338_carreras_filtros_modalidad_por_deporte.sql", import.meta.url), "utf8");
  const def = W1.slice(W1.indexOf("create or replace function carreras.filtros_avisos_validos"), W1.indexOf("revoke all on function carreras.filtros_avisos_validos"));
  const lista = (re: RegExp) => {
    const m = def.match(re);
    assert.ok(m, String(re));
    return [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]).sort();
  };
  const ordenar = (a: readonly string[]) => [...a].sort();
  assert.deepEqual(lista(/where k not in \(([^)]*)\)/), ordenar(CLAVES_FILTRO));
  assert.deepEqual(lista(/e\.key = 'deporte' and \(v #>> '\{\}'\) not in \(([^)]*)\)/), ordenar(DEPORTES.map((d) => d.id)));
  assert.deepEqual(lista(/e\.key = 'tipo' and \(v #>> '\{\}'\) not in \(([^)]*)\)/), ordenar(TIPOS_AVISO.map((d) => d.id)));
  assert.deepEqual(lista(/e\.key = 'distancia' and \(v #>> '\{\}'\) not in \(([^)]*)\)/), ordenar(DISTANCIAS.map((d) => d.id)));
  assert.deepEqual(lista(/e\.key in \(([^)]*)\) and \(v #>> '\{\}'\) !~/), ["modalidad_ciclismo", "modalidad_pie"]);
  assert.match(def, /char_length\(v #>> '\{\}'\) not between 1 and 80/);
  assert.match(def, /jsonb_array_length\(e\.value\) > 60/);
});

test("estando de baja no se ofrecen Telegram ni el push", () => {
  const src = readFileSync(new URL("../components/mis-avisos.tsx", import.meta.url), "utf8");
  const i = src.indexOf("{perfil?.baja_en ? (\n        <p className=\"text-xs text-ink/70\">{TEXTO_CANALES_EN_BAJA}</p>");
  assert.ok(i > 0, "bloque de baja antes de Telegram");
  const despues = src.slice(i);
  assert.ok(despues.indexOf("TEXTO_CANALES_EN_BAJA") < despues.indexOf("Telegram</h2>"));
  assert.ok(despues.indexOf("Activar avisos en este móvil") < despues.indexOf("</>"));
});

test("W2: zonas táctiles de al menos 24 px", () => {
  const f = readFileSync(new URL("../components/filtros-avisos.tsx", import.meta.url), "utf8");
  assert.match(f, /<label key=\{o\.id\} className="inline-flex min-h-6/);
  assert.match(f, /<summary className="flex min-h-6/);
  assert.match(f, /className="inline-flex min-h-6 items-center text-xs font-semibold text-forest[^"]*"\>\s*Quitar filtros/);
  const m = readFileSync(new URL("../components/mis-avisos.tsx", import.meta.url), "utf8");
  assert.match(m, /className="inline-flex min-h-6 items-center text-sm font-semibold text-ink[^"]*"\s*>\s*Salir/);
});
