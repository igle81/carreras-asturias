import assert from "node:assert/strict";
import test from "node:test";
import {
  concejosDe, eventosDelMes, finDeSemana, mesActualOSiguiente, mesesConPruebas,
  proximasYPasadas, pruebasFinDeSemana, pruebasTrail, slugConcejo,
} from "./paginas-seo";
import type { Evento } from "./types";

const ev = (p: Partial<Evento>): Evento => ({
  id_canonico: p.nombre ?? "x", nombre: "x", fecha_inicio: null, fecha_fin: null, municipio: null,
  municipio_meta: null, localidad: null, provincia: null, disciplina_normalizada: null, modalidad: null,
  distancias: null, organizador: null, url_oficial: null, estado_inscripcion: null, lat: null, lng: null,
  etiquetas: null, recien_abierta: null, calidad_score: null, ...p,
});
const jueves = new Date("2026-10-15T10:00:00Z");

test("fin de semana: de jueves al vie–dom siguiente; en domingo, el mismo", () => {
  assert.deepEqual(finDeSemana(jueves), { viernes: "2026-10-16", domingo: "2026-10-18" });
  assert.deepEqual(finDeSemana(new Date("2026-10-18T20:00:00Z")), { viernes: "2026-10-16", domingo: "2026-10-18" });
  assert.deepEqual(finDeSemana(new Date("2026-10-19T08:00:00Z")), { viernes: "2026-10-23", domingo: "2026-10-25" });
});

test("si no hay pruebas, salta al siguiente fin de semana", () => {
  const a = ev({ nombre: "A", fecha_inicio: "2026-10-18" });
  const b = ev({ nombre: "B", fecha_inicio: "2026-10-24" });
  assert.equal(pruebasFinDeSemana([a, b], jueves).eventos[0].nombre, "A");
  const r = pruebasFinDeSemana([b], jueves);
  assert.equal(r.siguiente, true);
  assert.equal(r.eventos[0].nombre, "B");
});

test("meses, trail y concejos salen solo de los datos", () => {
  const evs = [
    ev({ nombre: "T", fecha_inicio: "2026-11-02", disciplina_normalizada: "trail", municipio: "Luarca (Valdés)" }),
    ev({ nombre: "V", fecha_inicio: "2026-11-20", municipio: "Valdés" }),
    ev({ nombre: "F", fecha_inicio: "2026-09-01", municipio: "Mieres (Figaredo)" }),
  ];
  assert.deepEqual(mesesConPruebas(evs).map((m) => m.mes), ["septiembre", "noviembre"]);
  assert.equal(eventosDelMes(evs, "2026", "noviembre").length, 2);
  assert.equal(eventosDelMes(evs, "2026", "octubre").length, 0);
  assert.deepEqual(mesActualOSiguiente(evs, jueves), { anio: "2026", mes: "noviembre" });
  assert.deepEqual(pruebasTrail(evs, "2026").map((e) => e.nombre), ["T"]);
  const c = concejosDe(evs);
  assert.equal(c.get("valdes")?.eventos.length, 2);
  assert.ok(c.has("mieres"));
  assert.equal(slugConcejo("San Martín del Rey Aurelio"), "san-martin-del-rey-aurelio");
  const { proximas, pasadas } = proximasYPasadas(evs, jueves);
  assert.equal(proximas.length, 2);
  assert.equal(pasadas[0].nombre, "F");
});
