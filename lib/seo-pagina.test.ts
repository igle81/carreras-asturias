import assert from "node:assert/strict";
import { test } from "node:test";
import {
  breadcrumbJsonLd,
  CORRER_DESCRIPTION,
  DESCRIPCION_MAX,
  DESCRIPCION_MIN,
  eventDescription,
  eventMetadata,
  eventTitle,
  itemListEventosJsonLd,
  tituloConClasificacion,
  SITE_URL,
} from "./seo";
import {
  carrerasConFecha,
  concejoPath,
  esPaginaFina,
  MIN_CARRERAS_INDEXABLE,
  ROBOTS_NOINDEX_FOLLOW,
} from "./paginas-seo";
import { CLASIFICACIONES_MANUALES, FICHAS_SEO, TITULOS_SEO } from "./seo-fichas";
import { incluirIndiceMeses, seoRows } from "./sitemap-xml";
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

// --- Encargo SEO 04-11-2026 ---

test("title de ficha con clasificación publicada: «{Nombre}: clasificación» y ≤60", () => {
  const corto = eventTitle(ejemplo({ url_clasificacion: "https://example.com/resultados" }));
  assert.equal(corto, "10K Ejemplo 2026: clasificación · Carreras Asturias");
  const largo = tituloConClasificacion(
    "XIII Carrera Popular de Ejemplo por los caminos de la montaña asturiana 2026",
  );
  assert.ok(largo.endsWith(": clasificación"), largo);
  assert.ok(largo.length <= 60, `${largo.length}: ${largo}`);
});

test("sin clasificación el title no cambia", () => {
  assert.equal(eventTitle(ejemplo()), "10K Ejemplo 2026 · Carreras Asturias");
});

test("ajustes por ficha: title ≤60 y description 140-150; ganan al resto de reglas", () => {
  for (const [id, ajuste] of Object.entries(FICHAS_SEO)) {
    assert.ok(ajuste.title.length <= 60, `${id}: ${ajuste.title.length}`);
    assert.ok(enRango(ajuste.description), `${id}: ${ajuste.description.length}`);
    const ev = ejemplo({ id_canonico: id, url_clasificacion: "https://example.com/r" });
    assert.equal(eventTitle(ev), ajuste.title);
    assert.equal(eventDescription(ev), ajuste.description);
    const meta = eventMetadata(ev);
    assert.deepEqual(meta.title, { absolute: ajuste.title });
    assert.equal(meta.description, ajuste.description);
  }
});

test("clasificaciones manuales: solo URL https", () => {
  for (const url of Object.values(CLASIFICACIONES_MANUALES)) {
    assert.match(url, /^https:\/\//);
  }
});

test("titles fijos de clasificación: ≤60 y con «: clasificación»", () => {
  for (const [id, title] of Object.entries(TITULOS_SEO)) {
    assert.ok(title.length <= 60, `${id}: ${title.length}`);
    assert.ok(title.includes(": clasificación"), title);
    assert.equal(eventTitle(ejemplo({ id_canonico: id })), title);
  }
});

// --- Páginas finas (SEO 03-11-2026) ---

function serie(n: number, municipio: string, mes = "12", prefijo = "p"): Evento[] {
  return Array.from({ length: n }, (_, i) =>
    ejemplo({
      id_canonico: `${prefijo}-${municipio}-${i}`,
      municipio,
      fecha_inicio: `2026-${mes}-${String(i + 1).padStart(2, "0")}`,
      fecha_fin: `2026-${mes}-${String(i + 1).padStart(2, "0")}`,
    }),
  );
}

test("páginas finas: menos de 5 carreras = noindex,follow", () => {
  assert.equal(MIN_CARRERAS_INDEXABLE, 5);
  assert.equal(esPaginaFina(4), true);
  assert.equal(esPaginaFina(5), false);
  assert.deepEqual(ROBOTS_NOINDEX_FOLLOW, { index: false, follow: true });
});

test("sitemap: fuera meses y concejos con menos de 5 carreras", () => {
  const now = new Date("2026-11-04T12:00:00Z");
  // Diciembre: 5 en Laviana + 1 en Tineo = 6 (dentro). Enero 2027: 2 en Laviana (fuera).
  const events = [
    ...serie(5, "Laviana"),
    ...serie(1, "Tineo", "12", "t"),
    ...serie(2, "Laviana", "01", "e").map((e) => ({
      ...e,
      fecha_inicio: e.fecha_inicio.replace("2026", "2027"),
      fecha_fin: e.fecha_fin?.replace("2026", "2027") ?? null,
    })),
  ];
  const paths = seoRows(events, "2026-11-04", now).map((r) => r.path);
  assert.ok(paths.includes("/calendario/2026/diciembre"), paths.join(","));
  assert.ok(!paths.includes("/calendario/2027/enero"), paths.join(","));
  assert.ok(paths.includes(concejoPath("laviana")));
  assert.ok(!paths.includes(concejoPath("tineo")));
  assert.equal(carrerasConFecha(events), 8);
  assert.equal(incluirIndiceMeses(events), true);
  assert.equal(incluirIndiceMeses(serie(3, "Laviana")), false);
});
