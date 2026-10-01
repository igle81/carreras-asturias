import assert from "node:assert/strict";
import { test } from "node:test";
import { eventosParaMapa, lugarDelEvento, puntosDesdeEventos } from "./mapa-carreras";
import type { Evento } from "./types";

const HOY = new Date("2026-10-01T12:00:00+02:00");

function carrera(overrides: Partial<Evento> = {}): Evento {
  return {
    id_canonico: "carrera-ejemplo-2026",
    nombre: "Carrera ejemplo",
    fecha_inicio: "2026-10-17",
    fecha_fin: null,
    municipio: "Laviana",
    municipio_meta: null,
    localidad: null,
    provincia: "Asturias",
    disciplina_normalizada: "trail",
    modalidad: "pie",
    distancias: null,
    organizador: null,
    url_oficial: null,
    estado_inscripcion: "abierta",
    lat: 43.235,
    lng: -5.563,
    etiquetas: [],
    recien_abierta: false,
    calidad_score: null,
    duplicado_de: null,
    coords_precision: "aprox_municipio",
    ...overrides,
  };
}

test("el mapa se queda con las futuras y las de los últimos días, con sitio y sin duplicar", () => {
  const puntos = puntosDesdeEventos(
    [
      carrera(),
      carrera({
        id_canonico: "hace-tres-dias",
        nombre: "Hace tres días",
        fecha_inicio: "2026-09-28",
      }),
      carrera({
        id_canonico: "demasiado-antigua",
        nombre: "Demasiado antigua",
        fecha_inicio: "2026-09-20",
      }),
      carrera({
        id_canonico: "sin-sitio",
        lat: null,
        lng: null,
      }),
      carrera({
        id_canonico: "copia",
        duplicado_de: "carrera-ejemplo-2026",
      }),
      carrera({
        id_canonico: "probe-ca-2026-09-14",
        nombre: "Sonda",
      }),
    ],
    HOY,
  );

  assert.deepEqual(
    puntos.map((punto) => punto.nombre),
    ["Carrera ejemplo", "Hace tres días"],
  );
  assert.equal(puntos[0].lon, -5.563);
  assert.equal(puntos[0].enlace, "/evento/carrera-ejemplo-2026");
  assert.equal(puntos[0].fecha, "2026-10-17");
  assert.equal(puntos[0].categoria, "trail");
});

test("la nota de municipio solo sale cuando la precisión es el centro del concejo", () => {
  assert.equal(
    lugarDelEvento(carrera()),
    "Ubicación aproximada · Laviana",
  );
  assert.equal(
    lugarDelEvento(carrera({ coords_precision: "fuente", municipio: "Oviedo" })),
    "Oviedo",
  );
  assert.equal(
    lugarDelEvento(carrera({ coords_precision: "aprox_auditoria", municipio: null, localidad: "Suarías" })),
    "Suarías",
  );
  assert.equal(eventosParaMapa([carrera({ lat: 91, lng: 0 })], HOY).length, 0);
});
