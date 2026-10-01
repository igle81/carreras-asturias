import assert from "node:assert/strict";
import { test } from "node:test";
import { eventCta } from "./events";
import { postCarreraCta } from "./post-carrera";
import type { Evento } from "./types";

const AHORA = new Date("2026-10-01T12:00:00+02:00");
const URL_CAMPA =
  "https://www.empa-t.com/resultados/xxxvi-cross-subida-a-la-campa-de-torres-2026/";

function prueba(overrides: Partial<Evento> = {}): Evento {
  return {
    id_canonico: "carrera-ejemplo-2026",
    nombre: "Carrera ejemplo",
    fecha_inicio: "2026-10-20",
    fecha_fin: null,
    municipio: "Gijón",
    municipio_meta: null,
    localidad: null,
    provincia: "Asturias",
    disciplina_normalizada: "mixto",
    modalidad: "pie",
    distancias: null,
    organizador: null,
    url_oficial: "https://ejemplo.test/carrera",
    estado_inscripcion: "abierta",
    lat: null,
    lng: null,
    etiquetas: [],
    recien_abierta: false,
    calidad_score: 0.4,
    duplicado_de: null,
    ...overrides,
  };
}

test("Campa de Torres con url_clasificacion abre la clasificación", () => {
  const campa = prueba({
    id_canonico: "cross-subida-a-la-campa-de-torres-2026",
    nombre: "XXXVI Cross Subida a la Campa de Torres 2026",
    fecha_inicio: "2026-09-08",
    fecha_fin: "2026-09-08",
    estado_inscripcion: "cerrada",
    url_clasificacion: URL_CAMPA,
    estado_clasificacion: "publicada",
  });

  assert.deepEqual(postCarreraCta(campa, AHORA), {
    label: "Ver clasificación",
    href: URL_CAMPA,
    external: true,
  });
  assert.equal(eventCta(campa, AHORA).href, URL_CAMPA);
  assert.equal(eventCta(campa, AHORA).external, true);
});

test("sin enlace, la carrera celebrada sigue yendo a la ficha", () => {
  const event = prueba({
    id_canonico: "trail-sin-enlace-2026",
    fecha_inicio: "2026-09-01",
    fecha_fin: "2026-09-01",
    estado_inscripcion: "cerrada",
  });
  const cta = postCarreraCta(event, AHORA);
  assert.equal(cta?.external, false);
  assert.equal(cta?.label, "Clasificación");
  assert.equal(cta?.href, "/evento/trail-sin-enlace-2026#clasificacion");
});

test("una url antes de disputarse no sustituye la inscripción", () => {
  const event = prueba({
    fecha_inicio: "2026-11-15",
    estado_inscripcion: "desconocido",
    url_clasificacion: "https://www.empa-t.com/resultados/todavia-no/",
  });
  assert.equal(postCarreraCta(event, AHORA), null);
  assert.equal(eventCta(event, AHORA).label, "Consultar inscripción");
  assert.notEqual(eventCta(event, AHORA).href, event.url_clasificacion);
});
