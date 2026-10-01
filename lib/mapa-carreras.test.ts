import assert from "node:assert/strict";
import { test } from "node:test";
import { eventosParaMapa, lugarDelEvento, puntosDesdeEventos } from "./mapa-carreras";
import type { Evento } from "./types";

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

test("el mapa pinta las que tienen coordenadas válidas y descarta duplicados, sin mirar la fecha", () => {
  const puntos = puntosDesdeEventos([
    carrera(),
    carrera({
      id_canonico: "antigua",
      nombre: "Antigua",
      fecha_inicio: "2020-01-01",
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
  ]);

  assert.deepEqual(
    puntos.map((punto) => punto.nombre),
    ["Carrera ejemplo", "Antigua"],
  );
  assert.equal(puntos[0].lon, -5.563);
  assert.equal(puntos[0].enlace, "/evento/carrera-ejemplo-2026");
  assert.equal(puntos[0].fecha, "2026-10-17");
  assert.equal(puntos[0].categoria, "trail");
});

test("la nota de municipio solo sale cuando la precisión es el centro del concejo", () => {
  assert.equal(lugarDelEvento(carrera()), "Ubicación aproximada · Laviana");
  assert.equal(
    lugarDelEvento(carrera({ coords_precision: "fuente", municipio: "Oviedo" })),
    "Oviedo",
  );
  assert.equal(
    lugarDelEvento(carrera({ coords_precision: "aprox_auditoria", municipio: null, localidad: "Suarías" })),
    "Suarías",
  );
  assert.equal(eventosParaMapa([carrera({ lat: 91, lng: 0 })]).length, 0);
});
