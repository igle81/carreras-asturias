import assert from "node:assert/strict";
import { test } from "node:test";
import { paginaPublicaParaAnuncios } from "./adsense";
import { appsVisibles, esEstaApp, parseAppsAvilesia } from "./avilesia-apps";
import { CABECERAS_SEGURIDAD, HSTS } from "./cabeceras";
import { DECATHLON_RUNNING_HREF } from "./afiliado";
import { LEGAL_DOCUMENTS, LEGAL_PLACEHOLDERS } from "./legal";
import { familiaNavegador, rutaVipValida } from "./vip-cta";
import { crearLimiteIp } from "./limite-ip";
import { MENSAJE_ALTA_GENERICO } from "./registro-alertas";
import { incluirEnSitemap } from "./sitemap-xml";
import { cartelOptimizable } from "./cartel";
import { debeMostrarBannerPropio } from "./consentimiento-cookies";
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
  assert.equal(mapa["Strict-Transport-Security"], HSTS);
  assert.match(mapa["Strict-Transport-Security"], /includeSubDomains/);
  assert.equal(mapa["Strict-Transport-Security"].includes("preload"), false);
  assert.match(mapa["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(mapa["Content-Security-Policy"], /unsafe-inline/);
  assert.match(mapa["Content-Security-Policy"], /googlesyndication/);
  assert.match(mapa["Content-Security-Policy"], /supabase/);
  assert.match(mapa["Content-Security-Policy"], /onesignal/);
  assert.equal(mapa["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(mapa["Permissions-Policy"], /geolocation=\(self\)/);
});

test("el clic VIP guarda la familia del navegador y una ruta interna", () => {
  const chrome =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const edge = `${chrome} Edg/120.0.0.0`;
  assert.equal(familiaNavegador(edge), "Edge");
  assert.equal(familiaNavegador(chrome), "Chrome");
  assert.equal(familiaNavegador("Mozilla/5.0 (Macintosh) Version/17.0 Safari/605.1.15"), "Safari");
  assert.equal(familiaNavegador("Edge"), "Edge");
  assert.equal(familiaNavegador(""), null);
  assert.equal(familiaNavegador(chrome).includes("Mozilla"), false);
  assert.equal(rutaVipValida("/correr"), "/correr");
  assert.equal(rutaVipValida("/"), "/");
  assert.equal(rutaVipValida("https://evil.example/correr"), null);
  assert.equal(rutaVipValida("//evil.example"), null);
  assert.equal(rutaVipValida("/correr/../aviso-legal"), null);
  assert.equal(rutaVipValida("/correr?x=1"), null);
});

test("la privacidad fija 12 meses para los clics VIP", () => {
  const texto = JSON.stringify(LEGAL_DOCUMENTS.privacidad);
  assert.match(texto, /familia del navegador/);
  assert.match(texto, /clics del aviso VIP/);
  assert.match(texto, /12 meses/);
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

test("una ficha celebrada no entra en el sitemap", () => {
  const ahora = new Date("2026-10-13T12:00:00Z");
  const base = {
    id_canonico: "x",
    nombre: "Prueba",
    fecha_inicio: "2020-01-01",
    fecha_fin: "2020-01-01",
  } as Evento;
  assert.equal(incluirEnSitemap(base, ahora), false);
  assert.equal(
    incluirEnSitemap({ ...base, fecha_inicio: "2026-12-01", fecha_fin: "2026-12-01" }, ahora),
    true,
  );
});

test("el cartel de empa-t se puede servir en WebP y un host desconocido no", () => {
  assert.equal(cartelOptimizable("https://inscripciones.empa-t.com/cartel.jpg"), true);
  assert.equal(cartelOptimizable("http://inscripciones.empa-t.com/cartel.jpg"), false);
  assert.equal(cartelOptimizable("https://ejemplo.test/cartel.jpg"), false);
});

test("con la CMP de Google no se duplica el banner", () => {
  assert.equal(debeMostrarBannerPropio({ googleFc: true, tieneDecision: false, reabierto: true }), false);
  assert.equal(debeMostrarBannerPropio({ googleFc: false, tieneDecision: false, reabierto: false }), true);
  assert.equal(debeMostrarBannerPropio({ googleFc: false, tieneDecision: true, reabierto: false }), false);
  assert.equal(debeMostrarBannerPropio({ googleFc: false, tieneDecision: true, reabierto: true }), true);
});
