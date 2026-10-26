import assert from "node:assert/strict";
import { test } from "node:test";
import {
  breadcrumbJsonLd,
  CORRER_DESCRIPTION,
  DESCRIPCION_MAX,
  DESCRIPCION_MIN,
  eventDescription,
  itemListEventosJsonLd,
  SITE_URL,
} from "./seo";
import type { Evento } from "./types";

// Datos de ejemplo (ficticios en lo personal; nombres de concejos reales de Asturias).
function ejemplo(overrides: Partial<Evento> = {}): Evento {
  return {
    id_canonico: "10k-ejemplo-2026",
    nombre: "10K Ejemplo 2026",
    fecha_inicio: "2026-12-06",
    fecha_fin: "2026-12-06",
    municipio: "Laviana",
    municipio_meta: null,
    localidad: null,
    provincia: "Asturias",
    disciplina_normalizada: "asfalto",
    modalidad: "pie",
    distancias: [{ km: 10 }],
    organizador: null,
    url_oficial: null,
    estado_inscripcion: null,
    lat: null,
    lng: null,
    etiquetas: null,
    recien_abierta: null,
    calidad_score: null,
    ...overrides,
  };
}

const enRango = (s: string) => s.length >= DESCRIPCION_MIN && s.length <= DESCRIPCION_MAX;

test("/correr: meta description entre 140 y 150 caracteres", () => {
  assert.ok(enRango(CORRER_DESCRIPTION), `${CORRER_DESCRIPTION.length}`);
});

test("ficha: descripción con datos reales (fecha, concejo, disciplina, distancia)", () => {
  const d = eventDescription(ejemplo());
  assert.ok(enRango(d), `${d.length}: ${d}`);
  assert.match(d, /^10K Ejemplo 2026: /);
  assert.match(d, /6 de diciembre de 2026/);
  assert.match(d, /en Laviana \(Asturias\)/);
  assert.match(d, /A pie · Asfalto/);
  assert.match(d, /Distancias: 10 km/);
});

test("ficha: sin distancias no se inventan; sin concejo queda «en Asturias»", () => {
  const d = eventDescription(ejemplo({ distancias: null, municipio: null }));
  assert.ok(enRango(d), `${d.length}: ${d}`);
  assert.doesNotMatch(d, /Distancias|km/);
  assert.match(d, /, en Asturias\./);
});

test("ficha: siempre entre 140 y 150 con nombres de 1 a 160 caracteres y datos variados", () => {
  const municipios = [null, "Gijón", "Castrillón", "Sobrescobio"];
  const distancias = [null, [{ km: 10 }], [{ km: 42.2 }, { km: 21.1 }, { km: 10 }, { km: 5 }], [{ etiqueta: "trail" }, { km: 12.5 }]];
  const fechas: Array<[string | null, string | null]> = [
    ["2026-12-06", "2026-12-06"],
    ["2026-05-02", "2026-05-03"],
    [null, null],
  ];
  const relleno = "Carrera Popular de Ejemplo ".repeat(8);
  for (let n = 1; n <= 160; n++) {
    for (const municipio of municipios)
      for (const d of distancias)
        for (const [fecha_inicio, fecha_fin] of fechas) {
          const nombre = relleno.slice(0, n).trim() || "X";
          const s = eventDescription(ejemplo({ nombre, municipio, distancias: d, fecha_inicio, fecha_fin }));
          assert.ok(enRango(s), `${s.length}: ${s}`);
        }
  }
});

test("concejo: BreadcrumbList e ItemList con URL absolutas", () => {
  const migas = breadcrumbJsonLd([
    { nombre: "Inicio", path: "/" },
    { nombre: "Concejos", path: "/concejo" },
    { nombre: "Llanera", path: "/concejo/llanera" },
  ]);
  assert.equal(migas["@type"], "BreadcrumbList");
  const items = migas.itemListElement as Array<Record<string, unknown>>;
  assert.deepEqual(items.map((i) => i.position), [1, 2, 3]);
  assert.equal(items[0].item, SITE_URL);
  assert.equal(items[2].item, `${SITE_URL}/concejo/llanera`);

  const lista = itemListEventosJsonLd("Carreras en Llanera", [ejemplo(), ejemplo({ id_canonico: "otra-2026", nombre: "Otra 2026" })]);
  assert.equal(lista["@type"], "ItemList");
  assert.equal(lista.numberOfItems, 2);
  const el = lista.itemListElement as Array<Record<string, unknown>>;
  assert.equal(el[0].url, `${SITE_URL}/evento/10k-ejemplo-2026`);
  assert.equal(el[1].name, "Otra 2026");
  assert.equal(el[1].position, 2);
});
