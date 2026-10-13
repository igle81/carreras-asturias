import assert from "node:assert/strict";
import { test } from "node:test";
import { etiquetaCta } from "./clasificacion";
import { postCarreraCta } from "./post-carrera";
import type { Evento } from "./types";

const DESPUES = new Date("2026-10-12T08:00:00+02:00");

function carrera(overrides: Partial<Evento> = {}): Evento {
  return {
    id_canonico: "carrera-ejemplo-2026",
    nombre: "Carrera ejemplo",
    fecha_inicio: "2026-10-11",
    fecha_fin: null,
    municipio: "Oviedo",
    municipio_meta: null,
    localidad: null,
    provincia: "Asturias",
    disciplina_normalizada: "media_maraton",
    modalidad: "pie",
    distancias: [{ km: 21.0975, etiqueta: "media_maraton" }],
    organizador: null,
    url_oficial: "https://ejemplo.test/carrera",
    estado_inscripcion: "abierta",
    lat: null,
    lng: null,
    etiquetas: [],
    recien_abierta: false,
    calidad_score: 1,
    ...overrides,
  };
}

test("sin enlace el botón dice Clasificación pendiente y abre la ficha", () => {
  const cta = postCarreraCta(carrera(), DESPUES);
  assert.ok(cta);
  assert.equal(cta.label, "Clasificación pendiente");
  assert.equal(cta.href, "/evento/carrera-ejemplo-2026#clasificacion");
  assert.equal(cta.external, false);
  assert.equal(etiquetaCta(carrera(), cta), "Clasificación pendiente");
});

test("con enlace el botón dice Ver clasificación", () => {
  const event = carrera({
    url_clasificacion: "https://ejemplo.test/clasificacion/carrera",
  });
  const cta = postCarreraCta(event, DESPUES);
  assert.ok(cta);
  assert.equal(cta.external, true);
  assert.equal(etiquetaCta(event, cta), "Ver clasificación");
});
