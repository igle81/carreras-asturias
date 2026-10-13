import assert from "node:assert/strict";
import { test } from "node:test";
import { paginaPublicaParaAnuncios } from "./adsense";
import { appsVisibles, esEstaApp, parseAppsAvilesia } from "./avilesia-apps";
import { CABECERAS_SEGURIDAD } from "./cabeceras";
import { DECATHLON_RUNNING_HREF } from "./afiliado";
import { LEGAL_PLACEHOLDERS } from "./legal";
import { crearLimiteIp } from "./limite-ip";
import { MENSAJE_ALTA_GENERICO } from "./registro-alertas";
import { prioridadFicha } from "./sitemap-xml";
import type { Evento } from "./types";

test("los anuncios no entran en registro ni en avisos", () => {
  assert.equal(paginaPublicaParaAnuncios("/"), true);
  assert.equal(paginaPublicaParaAnuncios("/correr"), true);
  assert.equal(paginaPublicaParaAnuncios("/registro"), false);
  assert.equal(paginaPublicaParaAnuncios("/avisos"), false);
  assert.equal(paginaPublicaParaAnuncios("/acceso"), false);
});

test("las cabeceras piden nosniff, frame-ancestors y referrer", () => {
  const mapa = Object.fromEntries(CABECERAS_SEGURIDAD.map((item) => [item.key, item.value]));
  assert.equal(mapa["X-Content-Type-Options"], "nosniff");
  assert.match(mapa["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(mapa["Content-Security-Policy"], /googlesyndication/);
  assert.match(mapa["Content-Security-Policy"], /supabase/);
  assert.match(mapa["Content-Security-Policy"], /onesignal/);
  assert.equal(mapa["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(mapa["Permissions-Policy"], /geolocation=\(self\)/);
});

test("el alta no dice si el correo existe", () => {
  assert.equal(MENSAJE_ALTA_GENERICO.includes("ya tiene cuenta"), false);
  assert.match(MENSAJE_ALTA_GENERICO, /revisa el correo/);
});

test("el límite por IP corta el noveno intento", () => {
  const limite = crearLimiteIp({ max: 8, ventanaMs: 1000 });
  for (let i = 0; i < 8; i += 1) assert.equal(limite.contar("1.2.3.4", 0).permitido, true);
  assert.equal(limite.contar("1.2.3.4", 0).permitido, false);
  assert.equal(limite.contar("9.9.9.9", 0).permitido, true);
});

test("el bloque de AvilesIA no se incluye a sí mismo", () => {
  const propias = {
    id: "carreras",
    nombre: "Carreras Asturias",
    url: "https://www.carrerasasturias.es/",
    categoria: "Carreras",
    descripcion: "Carreras",
    hosts: ["carreras.avilesia.es"],
  };
  const otra = {
    id: "opos",
    nombre: "oposAsturIA",
    url: "https://opos.avilesia.es/",
    categoria: "Oposiciones",
    descripcion: "Busca tu oposición",
    hosts: ["opos.avilesia.es"],
  };
  assert.equal(esEstaApp(propias), true);
  assert.deepEqual(appsVisibles([propias, otra]).map((app) => app.id), ["opos"]);
  const parsed = parseAppsAvilesia({
    apps: [propias, { ...otra, activo: false }, otra],
  });
  assert.deepEqual(parsed.map((app) => app.id), ["opos"]);
});

test("Decathlon ya no apunta a la ruta que responde 404", () => {
  assert.equal(DECATHLON_RUNNING_HREF.includes("all-sports/running-trail.html"), false);
  assert.match(DECATHLON_RUNNING_HREF, /mc=AVILESIANETWORK/);
  assert.match(DECATHLON_RUNNING_HREF, /^https:\/\/www\.decathlon\.es\//);
});

test("el aviso legal ya no tiene marcadores", () => {
  assert.equal(LEGAL_PLACEHOLDERS.titular, "Javier Iglesias");
  assert.equal(LEGAL_PLACEHOLDERS.nif, "71880314R");
  assert.match(LEGAL_PLACEHOLDERS.domicilio, /Avilés/);
  assert.equal(JSON.stringify(LEGAL_PLACEHOLDERS).includes("[completar]"), false);
});

test("una ficha celebrada baja la prioridad y sigue en el sitemap", () => {
  const base = {
    id_canonico: "x",
    nombre: "Prueba",
    fecha_inicio: "2020-01-01",
    fecha_fin: "2020-01-01",
  } as Evento;
  assert.equal(prioridadFicha(base, new Date("2026-10-13T12:00:00Z")), "0.3");
  assert.equal(
    prioridadFicha({ ...base, fecha_inicio: "2026-12-01", fecha_fin: "2026-12-01" }, new Date("2026-10-13T12:00:00Z")),
    "0.6",
  );
});
