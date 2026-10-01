import assert from "node:assert/strict";
import { test } from "node:test";
import { enlaceClasificacionTarjeta } from "./clasificacion";
import { clasificacionDueAt, isListedOnPortal, isRaceFinished, POST_RACE_RETENTION_DAYS } from "./fin-estimado";
import {
  eventosVisiblesEnCalendario,
  mensajeCalendarioVacio,
  pasaFiltrosEstado,
  textoRecuento,
} from "./filtros-calendario";
import type { Evento } from "./types";

/** Mediodía en Europe/Madrid, 1 de octubre de 2026. */
const HOY = new Date("2026-10-01T12:00:00+02:00");

function sample(overrides: Partial<Evento> = {}): Evento {
  return {
    id_canonico: "carrera-ejemplo-2026",
    nombre: "Carrera ejemplo",
    fecha_inicio: "2026-11-01",
    fecha_fin: null,
    municipio: "Gijón",
    municipio_meta: null,
    localidad: null,
    provincia: "Asturias",
    disciplina_normalizada: "trail",
    modalidad: "pie",
    distancias: [{ km: 21, etiqueta: "21 km" }],
    organizador: null,
    url_oficial: "https://ejemplo.test/carrera",
    estado_inscripcion: "cerrada",
    lat: null,
    lng: null,
    etiquetas: [],
    recien_abierta: false,
    calidad_score: 0.4,
    duplicado_de: null,
    ...overrides,
  };
}

const URL_CAMPA = "https://ejemplo.test/clasificacion/campa-de-torres";

test("Cerradas deja las ya celebradas que siguen dentro de la ventana de listado", () => {
  const campa = sample({
    id_canonico: "cross-subida-a-la-campa-de-torres-2026",
    nombre: "XXXVI Cross Subida a la Campa de Torres 2026",
    fecha_inicio: "2026-09-08",
    fecha_fin: "2026-09-08",
    disciplina_normalizada: "mixto",
    url_clasificacion: URL_CAMPA,
  });
  const sinEnlace = sample({
    id_canonico: "trail-sin-enlace-2026",
    fecha_inicio: "2026-09-12",
    url_clasificacion: null,
  });
  const futura = sample({
    id_canonico: "trail-futuro-2026",
    fecha_inicio: "2026-11-02",
    estado_inscripcion: "abierta",
    url_clasificacion: "https://ejemplo.test/clasificacion/futura",
  });
  const antigua = sample({
    id_canonico: "trail-agosto-2026",
    fecha_inicio: "2026-08-01",
    url_clasificacion: "https://ejemplo.test/clasificacion/agosto",
  });

  assert.equal(isRaceFinished(campa, HOY), true);
  assert.equal(isListedOnPortal(campa, HOY), true);
  assert.equal(isListedOnPortal(antigua, HOY), false);

  const todas = [campa, sinEnlace, futura, antigua];
  const cerradas = eventosVisiblesEnCalendario(
    todas,
    { cerradas: true, conClasificacion: false },
    HOY,
  ).map((event) => event.id_canonico);

  assert.deepEqual(cerradas.sort(), ["cross-subida-a-la-campa-de-torres-2026", "trail-sin-enlace-2026"]);
  assert.equal(
    eventosVisiblesEnCalendario(todas, { cerradas: false, conClasificacion: false }, HOY).some(
      (event) => event.id_canonico === "trail-agosto-2026",
    ),
    false,
  );
});

test("Con clasificación exige enlace y se combina con Cerradas", () => {
  const campa = sample({
    id_canonico: "cross-subida-a-la-campa-de-torres-2026",
    fecha_inicio: "2026-09-08",
    url_clasificacion: URL_CAMPA,
  });
  const sinEnlace = sample({
    id_canonico: "trail-sin-enlace-2026",
    fecha_inicio: "2026-09-12",
    url_clasificacion: "   ",
  });
  const futura = sample({
    id_canonico: "trail-futuro-2026",
    fecha_inicio: "2026-11-02",
    url_clasificacion: "https://ejemplo.test/clasificacion/futura",
  });
  const todas = [campa, sinEnlace, futura];

  assert.deepEqual(
    eventosVisiblesEnCalendario(todas, { cerradas: false, conClasificacion: true }, HOY).map(
      (event) => event.id_canonico,
    ),
    ["cross-subida-a-la-campa-de-torres-2026", "trail-futuro-2026"],
  );
  assert.deepEqual(
    eventosVisiblesEnCalendario(todas, { cerradas: true, conClasificacion: true }, HOY).map(
      (event) => event.id_canonico,
    ),
    ["cross-subida-a-la-campa-de-torres-2026"],
  );
});

test("sin columna de clasificación el filtro no falla y no cuenta el enlace", () => {
  const sinColumna = sample({ fecha_inicio: "2026-09-12" });
  delete sinColumna.url_clasificacion;
  assert.equal(
    pasaFiltrosEstado(sinColumna, { cerradas: true, conClasificacion: false }, HOY),
    true,
  );
  assert.equal(
    pasaFiltrosEstado(sinColumna, { cerradas: true, conClasificacion: true }, HOY),
    false,
  );
  assert.equal(enlaceClasificacionTarjeta(sinColumna), null);
});

test("la tarjeta enlaza la clasificación cuando hay URL, también con datos de ejemplo", () => {
  const campa = sample({
    nombre: "XXXVI Cross Subida a la Campa de Torres 2026",
    url_clasificacion: URL_CAMPA,
  });
  assert.deepEqual(enlaceClasificacionTarjeta(campa), {
    href: URL_CAMPA,
    label: "Ver clasificación",
  });
  assert.equal(enlaceClasificacionTarjeta(sample({ url_clasificacion: "nota-interna" })), null);
});

test("el recuento y el vacío hablan en español", () => {
  assert.equal(textoRecuento(1, { cerradas: true, conClasificacion: true }), "1 prueba cerrada con clasificación");
  assert.equal(textoRecuento(4, { cerradas: true, conClasificacion: false }), "4 pruebas cerradas");
  assert.equal(textoRecuento(2, { cerradas: false, conClasificacion: true }), "2 pruebas con clasificación");
  assert.equal(
    mensajeCalendarioVacio({ recien: false, cerradas: true, conClasificacion: true }),
    "Ninguna carrera cerrada tiene la clasificación enlazada con esos filtros.",
  );
  assert.match(
    mensajeCalendarioVacio({ recien: false, cerradas: true, conClasificacion: false }),
    new RegExp(`${POST_RACE_RETENTION_DAYS} días`),
  );
});

test("el listado conserva las carreras 60 días tras celebrarse", () => {
  assert.equal(POST_RACE_RETENTION_DAYS, 60);
  const dentro = sample({
    id_canonico: "trail-agosto-tarde-2026",
    fecha_inicio: "2026-08-20",
    url_clasificacion: "https://ejemplo.test/clasificacion/agosto-tarde",
  });
  const fuera = sample({
    id_canonico: "trail-julio-2026",
    fecha_inicio: "2026-07-01",
    url_clasificacion: "https://ejemplo.test/clasificacion/julio",
  });
  const due = clasificacionDueAt(dentro);
  assert.ok(due);
  const dias = (HOY.getTime() - due.getTime()) / 86_400_000;
  assert.ok(dias > 30 && dias <= 60, `se esperaban entre 30 y 60 días, hubo ${dias}`);
  assert.equal(isListedOnPortal(dentro, HOY), true);
  assert.equal(isListedOnPortal(fuera, HOY), false);
  assert.deepEqual(
    eventosVisiblesEnCalendario([dentro, fuera], { cerradas: true, conClasificacion: true }, HOY).map(
      (event) => event.id_canonico,
    ),
    ["trail-agosto-tarde-2026"],
  );
});
