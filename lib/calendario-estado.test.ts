import assert from "node:assert/strict";
import { test } from "node:test";
import {
  eventosVisiblesEnCalendario,
  textoRecuentoCalendario,
} from "./calendario-estado";
import { listedEvents } from "./post-carrera";
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

const campa = prueba({
  id_canonico: "cross-subida-a-la-campa-de-torres-2026",
  nombre: "XXXVI Cross Subida a la Campa de Torres 2026",
  fecha_inicio: "2026-09-08",
  fecha_fin: "2026-09-08",
  estado_inscripcion: "cerrada",
  url_clasificacion: URL_CAMPA,
  estado_clasificacion: "publicada",
});

const antigua = prueba({
  id_canonico: "trail-antigua-2026",
  nombre: "Trail antigua",
  fecha_inicio: "2026-07-01",
  fecha_fin: "2026-07-01",
  estado_inscripcion: "cerrada",
  url_clasificacion: "https://www.empa-t.com/resultados/trail-antigua/",
});

const celebradaSinEnlace = prueba({
  id_canonico: "trail-sin-enlace-2026",
  nombre: "Trail sin enlace",
  fecha_inicio: "2026-09-01",
  fecha_fin: "2026-09-01",
  estado_inscripcion: "cerrada",
  url_clasificacion: null,
});

const proximaConUrl = prueba({
  id_canonico: "trail-proxima-2026",
  nombre: "Trail próxima",
  fecha_inicio: "2026-11-15",
  url_clasificacion: "https://www.empa-t.com/resultados/no-deberia/",
});

test("ya celebradas incluye pruebas fuera de los 30 días y con clasificación las recorta", () => {
  const todas = [campa, antigua, celebradaSinEnlace, proximaConUrl];

  assert.equal(
    listedEvents(todas, AHORA).some((event) => event.id_canonico === antigua.id_canonico),
    false,
  );
  assert.equal(
    listedEvents(todas, AHORA).some((event) => event.id_canonico === campa.id_canonico),
    true,
  );

  const celebradas = eventosVisiblesEnCalendario(
    todas,
    { celebradas: true, conClasificacion: false },
    AHORA,
  ).map((event) => event.id_canonico);
  assert.deepEqual(celebradas.sort(), [
    campa.id_canonico,
    antigua.id_canonico,
    celebradaSinEnlace.id_canonico,
  ]);

  const conEnlace = eventosVisiblesEnCalendario(
    todas,
    { celebradas: true, conClasificacion: true },
    AHORA,
  ).map((event) => event.id_canonico);
  assert.deepEqual(conEnlace.sort(), [campa.id_canonico, antigua.id_canonico]);
});

test("el recuento nombra el filtro activo", () => {
  assert.equal(textoRecuentoCalendario(1, { celebradas: false, conClasificacion: false }), "1 prueba");
  assert.equal(
    textoRecuentoCalendario(4, { celebradas: true, conClasificacion: false }),
    "4 pruebas ya celebradas",
  );
  assert.equal(
    textoRecuentoCalendario(1, { celebradas: true, conClasificacion: false }),
    "1 prueba ya celebrada",
  );
  assert.equal(
    textoRecuentoCalendario(5, { celebradas: true, conClasificacion: true }),
    "5 pruebas con clasificación",
  );
});
