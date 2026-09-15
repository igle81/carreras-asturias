import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasAperturaReciente,
  isRecienAbiertaFuego,
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

test("Acebo and Asturcantabro stay embargoed (PRO 14/09 VIP+24h)", () => {
  assert.equal(isHighlightEmbargoed("desafio-el-acebo-2026", DURING), true);
  assert.equal(
    isHighlightEmbargoed("desafio-el-acebo-2026-2026-09-26-ciclismo", DURING),
    true,
  );
  assert.equal(
    isHighlightEmbargoed("encuentro-asturcantabro-de-escuelas-2026", DURING),
    true,
  );
  assert.equal(
    isHighlightEmbargoed(
      "encuentro-asturcantabro-de-escuelas-2026-2026-09-20-ciclismo",
      DURING,
    ),
    true,
  );
});

test("Villacabra is embargoed until 15/09 21:00 Europe/Madrid", () => {
  assert.equal(isHighlightEmbargoed(VILLACABRA, DURING), true);
  assert.equal(isHighlightEmbargoed(VILLACABRA_SHORT, DURING), true);
  assert.equal(isHighlightEmbargoed(VILLACABRA, AFTER), false);
  assert.equal(isHighlightEmbargoed(VILLACABRA_SHORT, AFTER), false);
});

test("strip Recién abiertas ignores VIP+24h; Villacabra day 1 is Abierta ayer", () => {
  const villacabra = sampleEvent({
    id_canonico: VILLACABRA,
    nombre: "XIII Trail Villacabra 2026",
    fecha_inicio: "2026-12-13",
    fecha_apertura_inscripcion: "2026-09-14",
    estado_inscripcion: "abierta",
    recien_abierta: true,
  });
  const other = sampleEvent({
    id_canonico: "otra-trail-2026",
    fecha_inicio: "2026-09-20",
    fecha_apertura_inscripcion: "2026-08-01",
  });

  assert.equal(isHighlightEmbargoed(VILLACABRA, DURING), true);
  assert.equal(resolveAperturaBadge(villacabra, DURING), "abierta_ayer");
  assert.equal(hasAperturaReciente(villacabra, DURING), true);
  assert.equal(isRecienAbiertaFuego(villacabra, DURING), false);
  assert.deepEqual(
    recienAbiertas([villacabra, other], DURING).map((event) => event.id_canonico),
    [VILLACABRA],
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

const ROBER_KEEP = "marcha-solidaria-rober-contra-el-cancer-2026";
const ROBER_HIDE = "marcha-solidaria-rober-contra-el-cancer-2026-2026-09-20-ciclismo";
const ON_15 = new Date("2026-09-15T12:00:00+02:00");

test("Rober lote is hidden; canonical stays in hero", () => {
  const keep = sampleEvent({
    id_canonico: ROBER_KEEP,
    nombre: "Marcha Solidaria Rober contra el Cáncer 2026",
    fecha_inicio: "2026-09-20",
    modalidad: "ciclismo",
    fecha_apertura_inscripcion: null,
    calidad_score: 0.9,
  });
  const hide = sampleEvent({
    id_canonico: ROBER_HIDE,
    nombre: "Marcha Solidaria Rober contra el cáncer 2026",
    fecha_inicio: "2026-09-20",
    modalidad: "ciclismo",
    fecha_apertura_inscripcion: null,
  });

  const visible = hidePortalDuplicates([keep, hide]);
  assert.deepEqual(
    visible.map((event) => event.id_canonico),
    [ROBER_KEEP],
  );
  assert.equal(resolveCanonicalEventId(ROBER_HIDE), ROBER_KEEP);
  assert.deepEqual(
    pickHeroSlides([keep, hide], ON_15).map((event) => event.id_canonico),
    [ROBER_KEEP],
  );
});

test("canonical Auditor hides (Mysterioux prensa, Boomerang Llangreu, probes) leave listado", () => {
  const rows = [
    sampleEvent({
      id_canonico: "mysterioux-race-2026",
      nombre: "Mysterioux Race 2026",
      fecha_inicio: "2026-10-11",
      modalidad: "pie",
    }),
    sampleEvent({
      id_canonico: "mysterioux-race-2026-2026-10-11-pie",
      nombre: "Mysterioux Race 2026",
      fecha_inicio: "2026-10-11",
      modalidad: "pie",
    }),
    sampleEvent({
      id_canonico: "vii-carrera-popular-llangreu-natural-2026-2026-10-18-pie",
      nombre: "VII Carrera Popular Llangréu Natural 2026",
      fecha_inicio: "2026-10-18",
      modalidad: "pie",
    }),
    sampleEvent({
      id_canonico: "llangreu-natural-2026-vii-carrera-popular-2026-10-18-pie",
      nombre: "Llangreu Natural 2026 (VII Carrera Popular)",
      fecha_inicio: "2026-10-18",
      modalidad: "pie",
    }),
    sampleEvent({
      id_canonico: "probe-ca-2026-09-14",
      nombre: "Probe CA",
      fecha_inicio: "2026-11-01",
    }),
    sampleEvent({
      id_canonico: "probe-ca-2026-09-14-b",
      nombre: "Probe CA B",
      fecha_inicio: "2026-11-02",
    }),
    sampleEvent({
      id_canonico: "probe-ca-2026-09-14-c",
      nombre: "Probe C",
      fecha_inicio: "2026-11-03",
    }),
  ];

  assert.deepEqual(
    hidePortalDuplicates(rows).map((event) => event.id_canonico),
    [
      "mysterioux-race-2026-2026-10-11-pie",
      "llangreu-natural-2026-vii-carrera-popular-2026-10-18-pie",
    ],
  );
  assert.equal(
    listedEvents(rows, ON_15).some((event) => event.id_canonico.startsWith("probe-ca-")),
    false,
  );
});

test("recién abierta is max 3 days from fecha; stale tags do not count", () => {
  const sanCosme = sampleEvent({
    id_canonico: "trail-san-cosme-2026",
    nombre: "Trail San Cosme 2026",
    fecha_inicio: "2026-10-01",
    fecha_apertura_inscripcion: "2026-09-03",
    recien_abierta: true,
    etiquetas: ["recien_abierta"],
  });
  const avalancha = sampleEvent({
    id_canonico: AVALANCHA_CANON,
    nombre: "Open EndurAstur Avalanchillas 2026 / Avalancha Illas",
    fecha_inicio: "2026-10-11",
    modalidad: "ciclismo",
    fecha_apertura_inscripcion: "2026-09-11",
  });
  const rober = sampleEvent({
    id_canonico: ROBER_KEEP,
    nombre: "Marcha Solidaria Rober contra el Cáncer 2026",
    fecha_inicio: "2026-09-20",
    modalidad: "ciclismo",
    fecha_apertura_inscripcion: null,
  });
  const day3 = sampleEvent({
    id_canonico: "abierta-hace-tres-2026",
    fecha_apertura_inscripcion: "2026-09-12",
  });
  const day0 = sampleEvent({
    id_canonico: "abierta-hoy-2026",
    fecha_apertura_inscripcion: "2026-09-15",
  });

  assert.equal(resolveAperturaBadge(sanCosme, ON_15), null);
  assert.equal(hasAperturaReciente(sanCosme, ON_15), false);
  assert.equal(resolveAperturaBadge(avalancha, ON_15), null);
  assert.equal(hasAperturaReciente(rober, ON_15), false);
  assert.equal(resolveAperturaBadge(day3, ON_15), "recien_abierta");
  assert.equal(resolveAperturaBadge(day0, ON_15), "abierta_hoy");
  assert.deepEqual(
    recienAbiertas([sanCosme, avalancha, rober, day3, day0], ON_15).map(
      (event) => event.id_canonico,
    ),
    ["abierta-hace-tres-2026", "abierta-hoy-2026"],
  );
});

test("Villacabra day 1 after embargo is Abierta ayer (recién true, not 🔥)", () => {
  const villacabra = sampleEvent({
    id_canonico: VILLACABRA,
    nombre: "XIII Trail Villacabra 2026",
    fecha_inicio: "2026-12-13",
    fecha_apertura_inscripcion: "2026-09-14",
    estado_inscripcion: "abierta",
    recien_abierta: true,
  });

  assert.equal(resolveAperturaBadge(villacabra, AFTER), "abierta_ayer");
  assert.equal(hasAperturaReciente(villacabra, AFTER), true);
  assert.equal(isRecienAbiertaFuego(villacabra, AFTER), false);
  assert.deepEqual(
    recienAbiertas([villacabra], AFTER).map((event) => event.id_canonico),
    [VILLACABRA],
  );
});
