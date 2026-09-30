import assert from "node:assert/strict";
import { test } from "node:test";
import { entraEnStripRecienAbiertas } from "./apertura-badge";
import { recienAbiertas } from "./events";
import type { Evento } from "./types";

/** Mediodía en Europe/Madrid: el día civil es 2026-09-30. */
const HOY = new Date("2026-09-30T12:00:00+02:00");

function sampleEvent(overrides: Partial<Evento> = {}): Evento {
  return {
    id_canonico: "carrera-ejemplo-2026",
    nombre: "Carrera ejemplo",
    fecha_inicio: "2026-11-01",
    fecha_fin: "2026-11-01",
    municipio: "Gijón",
    municipio_meta: null,
    localidad: null,
    provincia: "Asturias",
    disciplina_normalizada: "cross",
    modalidad: "pie",
    distancias: null,
    organizador: null,
    url_oficial: null,
    estado_inscripcion: "abierta",
    fecha_apertura_inscripcion: "2026-09-30",
    lat: null,
    lng: null,
    etiquetas: [],
    recien_abierta: true,
    calidad_score: 0.4,
    duplicado_de: null,
    ...overrides,
  };
}

function assertFuera(event: Evento) {
  assert.equal(entraEnStripRecienAbiertas(event, HOY), false);
  assert.deepEqual(
    recienAbiertas([event], HOY).map((row) => row.id_canonico),
    [],
  );
}

function assertDentro(event: Evento) {
  assert.equal(entraEnStripRecienAbiertas(event, HOY), true);
  assert.deepEqual(
    recienAbiertas([event], HOY).map((row) => row.id_canonico),
    [event.id_canonico],
  );
}

test("cerrada + apertura hoy queda fuera del strip", () => {
  const cerrada = sampleEvent({
    id_canonico: "1campoatravsescolarzonaldegijn2026-2026-10-24-pie",
    estado_inscripcion: "cerrada",
    recien_abierta: false,
    fecha_apertura_inscripcion: "2026-09-30",
  });
  const cerradaConFlag = sampleEvent({
    id_canonico: "cerrada-con-flag-2026",
    estado_inscripcion: "cerrada",
    recien_abierta: true,
    fecha_apertura_inscripcion: "2026-09-30",
  });

  assertFuera(cerrada);
  assertFuera(cerradaConFlag);
});

test("abierta + recien_abierta=false queda fuera del strip", () => {
  const event = sampleEvent({
    id_canonico: "abierta-sin-flag-2026",
    estado_inscripcion: "abierta",
    recien_abierta: false,
    fecha_apertura_inscripcion: "2026-09-28",
  });

  assertFuera(event);
});

test("abierta + recien_abierta=true + apertura hace 2 días entra en el strip", () => {
  const event = sampleEvent({
    id_canonico: "abierta-hace-dos-2026",
    estado_inscripcion: "abierta",
    recien_abierta: true,
    fecha_apertura_inscripcion: "2026-09-28",
  });

  assertDentro(event);
});

test("abierta + recien_abierta=true + apertura hace 5 días queda fuera del strip", () => {
  const event = sampleEvent({
    id_canonico: "abierta-hace-cinco-2026",
    estado_inscripcion: "abierta",
    recien_abierta: true,
    fecha_apertura_inscripcion: "2026-09-25",
  });

  assertFuera(event);
});

test("apertura futura queda fuera del strip", () => {
  const event = sampleEvent({
    id_canonico: "apertura-futura-2026",
    estado_inscripcion: "abierta",
    recien_abierta: true,
    fecha_apertura_inscripcion: "2026-10-02",
  });

  assertFuera(event);
});
