import assert from "node:assert/strict";
import { test } from "node:test";
import {
  eventOffersJsonLd,
  eventStatusJsonLd,
  schemaDay,
  SITE_URL,
  sportsEventJsonLd,
} from "./seo";
import type { Evento } from "./types";

function sampleEvent(overrides: Partial<Evento> = {}): Evento {
  return {
    id_canonico: "vuelta-concejo-de-pilona-btt-2026",
    nombre: "XXIV Vuelta Concejo de Piloña BTT 2026",
    fecha_inicio: "2026-10-03",
    fecha_fin: "2026-10-03",
    municipio: "Piloña",
    municipio_meta: null,
    localidad: null,
    provincia: "Asturias",
    disciplina_normalizada: "mtb",
    modalidad: "ciclismo",
    distancias: null,
    organizador: "Vuelta Concejo de Piloña",
    url_oficial: "https://inscripciones.empa-t.com/inscripcion/xxiv-vuelta-concejo-de-pilona-btt-2026/",
    estado_inscripcion: "abierta",
    fecha_apertura_inscripcion: "2026-09-01",
    lat: 43.35,
    lng: -5.36,
    etiquetas: null,
    recien_abierta: false,
    calidad_score: 0.5,
    ...overrides,
  };
}

test("schemaDay keeps calendar dates without inventing midnight", () => {
  assert.equal(schemaDay("2026-10-03"), "2026-10-03");
  assert.equal(schemaDay("2026-10-03T12:00:00Z"), "2026-10-03");
  assert.equal(schemaDay("  "), undefined);
});

test("single-day events set endDate equal to startDate", () => {
  const json = sportsEventJsonLd(sampleEvent());
  assert.equal(json.startDate, "2026-10-03");
  assert.equal(json.endDate, "2026-10-03");
});

test("multi-day events keep fecha_fin as endDate", () => {
  const json = sportsEventJsonLd(
    sampleEvent({ fecha_inicio: "2026-09-12", fecha_fin: "2026-09-13" }),
  );
  assert.equal(json.startDate, "2026-09-12");
  assert.equal(json.endDate, "2026-09-13");
});

test("always sets description, eventStatus, and www canonical URL", () => {
  const json = sportsEventJsonLd(sampleEvent());
  assert.equal(json["@type"], "SportsEvent");
  assert.equal(json.eventStatus, "https://schema.org/EventScheduled");
  assert.match(String(json.description), /Piloña/);
  assert.equal(
    json.url,
    `${SITE_URL}/evento/vuelta-concejo-de-pilona-btt-2026`,
  );
  assert.equal(SITE_URL, "https://www.carrerasasturias.es");
});

test("organizer Organization is reused as performer; no fake person", () => {
  const json = sportsEventJsonLd(sampleEvent());
  assert.deepEqual(json.organizer, {
    "@type": "Organization",
    name: "Vuelta Concejo de Piloña",
    url: "https://inscripciones.empa-t.com/inscripcion/xxiv-vuelta-concejo-de-pilona-btt-2026/",
  });
  assert.deepEqual(json.performer, {
    "@type": "Organization",
    name: "Vuelta Concejo de Piloña",
  });

  const withoutOrg = sportsEventJsonLd(sampleEvent({ organizador: "  " }));
  assert.equal(withoutOrg.organizer, undefined);
  assert.equal(withoutOrg.performer, undefined);
});

test("offers uses official URL and inscription availability, never a made-up price", () => {
  const open = eventOffersJsonLd(sampleEvent())!;
  assert.equal(open["@type"], "Offer");
  assert.equal(
    open.url,
    "https://inscripciones.empa-t.com/inscripcion/xxiv-vuelta-concejo-de-pilona-btt-2026/",
  );
  assert.equal(open.availability, "https://schema.org/InStock");
  assert.equal(open.validFrom, "2026-09-01");
  assert.equal("price" in open, false);

  const closed = eventOffersJsonLd(sampleEvent({ estado_inscripcion: "cerrada" }))!;
  assert.equal(closed.availability, "https://schema.org/SoldOut");
  assert.equal("price" in closed, false);

  const soon = eventOffersJsonLd(sampleEvent({ estado_inscripcion: "proximamente" }))!;
  assert.equal(soon.availability, "https://schema.org/PreOrder");

  const unknown = eventOffersJsonLd(sampleEvent({ estado_inscripcion: "desconocido" }))!;
  assert.equal("availability" in unknown, false);

  assert.equal(eventOffersJsonLd(sampleEvent({ url_oficial: null })), undefined);
});

test("gratuita tag is the only case that sets price 0", () => {
  const free = eventOffersJsonLd(sampleEvent({ etiquetas: ["gratuita"] }))!;
  assert.equal(free.price, 0);
  assert.equal(free.priceCurrency, "EUR");
});

test("eventStatus maps cancelled/postponed labels, not inscripción cerrada", () => {
  assert.equal(
    eventStatusJsonLd(sampleEvent({ estado_inscripcion: "cerrada" })),
    "https://schema.org/EventScheduled",
  );
  assert.equal(
    eventStatusJsonLd(sampleEvent({ etiquetas: ["cancelada"] })),
    "https://schema.org/EventCancelled",
  );
  assert.equal(
    eventStatusJsonLd(sampleEvent({ etiquetas: ["aplazada"] })),
    "https://schema.org/EventPostponed",
  );
});
