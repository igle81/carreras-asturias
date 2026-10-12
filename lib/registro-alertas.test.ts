import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ALERTAS_CONFIRMAR_PATH,
  emailRegistroValido,
  instagramRegistro,
  nombreRegistroValido,
  resolverDatosAlta,
  RUTA_REGISTRO,
  urlConfirmarAlertas,
} from "./registro-alertas";

test("acepta un correo y lo pasa a minúsculas", () => {
  assert.equal(emailRegistroValido("  Ana@Ejemplo.es "), "ana@ejemplo.es");
});

test("rechaza correos vacíos o sin dominio", () => {
  assert.equal(emailRegistroValido(""), null);
  assert.equal(emailRegistroValido("ana"), null);
  assert.equal(emailRegistroValido("ana@"), null);
  assert.equal(emailRegistroValido(12), null);
});

test("nombre e instagram se normalizan y el cuerpo manda sobre la metadata", () => {
  assert.equal(nombreRegistroValido("  Ana   Ruta "), "Ana Ruta");
  assert.equal(nombreRegistroValido("   "), null);
  assert.deepEqual(instagramRegistro(""), { ok: true, instagram: null });
  assert.deepEqual(instagramRegistro("@Ana.Ruta"), { ok: true, instagram: "@Ana.Ruta" });
  assert.deepEqual(instagramRegistro("ana ruta"), { ok: false });
  assert.deepEqual(resolverDatosAlta({ nombre: "Ana", instagram: "ana", push: true }, { nombre: "Otra" }), {
    nombre: "Ana",
    instagram: "@ana",
    pushActivado: true,
  });
  assert.deepEqual(resolverDatosAlta({}, { nombre: "Ana", instagram: "", push_activado: false }), {
    nombre: "Ana",
    instagram: null,
    pushActivado: false,
  });
  assert.equal(
    resolverDatosAlta({ nombre: "Ana", instagram: "mal handle" }, { nombre: "Otra", instagram: "@ok" }),
    null,
  );
});

test("el alta está en /registro y el magic link vuelve a confirmar", () => {
  assert.equal(RUTA_REGISTRO, "/registro");
  assert.equal(ALERTAS_CONFIRMAR_PATH, "/alertas/confirmar");
  assert.equal(RUTA_REGISTRO.includes("confirmar"), false);
});

test("la vuelta del magic link apunta a la confirmación", () => {
  assert.equal(
    urlConfirmarAlertas("https://carreras.avilesia.es/"),
    "https://carreras.avilesia.es/alertas/confirmar",
  );
});
