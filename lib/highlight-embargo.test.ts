import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasAperturaReciente,
  resolveAperturaBadge,
} from "./apertura-badge";
import {
  estaQuincena,
  pickHeroSlides,
  recienAbiertas,
} from "./events";
import { isHighlightEmbargoed } from "./highlight-embargo";
import { listedEvents } from "./post-carrera";
import {
  hidePortalDuplicates,
  resolveCanonicalEventId,
} from "./portal-dedupe";
import type { Evento } from "./types";

const VILLACABRA = "xiii-trail-villacabra-2026-2026-12-13-pie";
const VILLACABRA_SHORT = "xiii-trail-villacabra-2026";
const AVALANCHA_CANON = "open-endurastur-avalanchillas-illas-2026";
const AVALANCHA_LOTE =
  "open-endurastur-avalanchillas-2026-avalancha-illas-2026-10-11-ciclismo";

const DURING = new Date("2026-09-15T00:05:00+02:00");
const AFTER = new Date("2026-09-15T21:00:01+02:00");

function sampleEvent(overrides: Partial<Evento> = {}): Evento {
  return {
    id_canonico: "carrera-ejemplo-2026",
    nombre: "Carrera ejemplo",
    fecha_inicio: "2026-09-20",
    fecha_fin: "2026-09-20",
    municipio: "Oviedo",
    municipio_meta: null,
    localidad: null,
    provincia: "Asturias",
    disciplina_normalizada: "trail",
    modalidad: "pie",
    distancias: null,
    organizador: null,
    url_oficial: null,
    estado_inscripcion: "abierta",
    fecha_apertura_inscripcion: "2026-09-14",
    lat: null,
    lng: null,
    etiquetas: [],
    recien_abierta: false,
    calidad_score: 0.4,
    duplicado_de: null,
    ...overrides,
  };
}

test("Villacabra is embargoed until 15/09 21:00 Europe/Madrid", () => {
  assert.equal(isHighlightEmbargoed(VILLACABRA, DURING), true);
  assert.equal(isHighlightEmbargoed(VILLACABRA_SHORT, DURING), true);
  assert.equal(isHighlightEmbargoed(VILLACABRA, AFTER), false);
  assert.equal(isHighlightEmbargoed(VILLACABRA_SHORT, AFTER), false);
});

test("embargo hides Villacabra from recién abiertas and 🔥 badges, not listado", () => {
  const villacabra = sampleEvent({
    id_canonico: VILLACABRA,
    nombre: "XIII Trail Villacabra 2026",
    fecha_inicio: "2026-12-13",
    fecha_apertura_inscripcion: "2026-09-14",
    estado_inscripcion: "abierta",
  });
  const other = sampleEvent({
    id_canonico: "otra-trail-2026",
    fecha_inicio: "2026-09-20",
  });

  assert.equal(resolveAperturaBadge(villacabra, DURING), null);
  assert.equal(hasAperturaReciente(villacabra, DURING), false);
  assert.deepEqual(
    recienAbiertas([villacabra, other], DURING).map((event) => event.id_canonico),
    ["otra-trail-2026"],
  );
  assert.equal(
    pickHeroSlides([villacabra], DURING).some((event) => event.id_canonico === VILLACABRA),
    false,
  );
  assert.equal(
    estaQuincena([villacabra], DURING).some((event) => event.id_canonico === VILLACABRA),
    false,
  );
  assert.equal(
    listedEvents([villacabra], DURING).some((event) => event.id_canonico === VILLACABRA),
    true,
  );
});

test("after embargo, Villacabra can show apertura reciente from fecha", () => {
  const villacabra = sampleEvent({
    id_canonico: VILLACABRA,
    nombre: "XIII Trail Villacabra 2026",
    fecha_inicio: "2026-12-13",
    fecha_apertura_inscripcion: "2026-09-14",
    estado_inscripcion: "abierta",
  });

  assert.equal(resolveAperturaBadge(villacabra, AFTER), "abierta_ayer");
  assert.equal(hasAperturaReciente(villacabra, AFTER), true);
  assert.deepEqual(
    recienAbiertas([villacabra], AFTER).map((event) => event.id_canonico),
    [VILLACABRA],
  );
});

test("Avalanchillas lote is hidden; canonical stays", () => {
  const canonical = sampleEvent({
    id_canonico: AVALANCHA_CANON,
    nombre: "Open EndurAstur Avalanchillas 2026 / Avalancha Illas",
    fecha_inicio: "2026-10-11",
    modalidad: "ciclismo",
  });
  const lote = sampleEvent({
    id_canonico: AVALANCHA_LOTE,
    nombre: "Open EndurAstur Avalanchillas 2026 / Avalancha Illas",
    fecha_inicio: "2026-10-11",
    modalidad: "ciclismo",
  });

  const visible = hidePortalDuplicates([canonical, lote]);
  assert.deepEqual(
    visible.map((event) => event.id_canonico),
    [AVALANCHA_CANON],
  );
  assert.equal(resolveCanonicalEventId(AVALANCHA_LOTE), AVALANCHA_CANON);
  assert.deepEqual(
    listedEvents([canonical, lote], DURING).map((event) => event.id_canonico),
    [AVALANCHA_CANON],
  );
});

test("rows with duplicado_de are hidden from portal lists", () => {
  const canonical = sampleEvent({ id_canonico: "evento-canon-2026" });
  const alias = sampleEvent({
    id_canonico: "evento-lote-2026",
    duplicado_de: "evento-canon-2026",
  });
  assert.deepEqual(
    hidePortalDuplicates([canonical, alias]).map((event) => event.id_canonico),
    ["evento-canon-2026"],
  );
  assert.equal(resolveCanonicalEventId(alias.id_canonico, [canonical, alias]), "evento-canon-2026");
});
