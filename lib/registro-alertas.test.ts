import assert from "node:assert/strict";
import { test } from "node:test";
import { emailRegistroValido, urlConfirmarAlertas } from "./registro-alertas";

test("acepta un correo y lo pasa a minúsculas", () => {
  assert.equal(emailRegistroValido("  Ana@Ejemplo.es "), "ana@ejemplo.es");
});

test("rechaza correos vacíos o sin dominio", () => {
  assert.equal(emailRegistroValido(""), null);
  assert.equal(emailRegistroValido("ana"), null);
  assert.equal(emailRegistroValido("ana@"), null);
  assert.equal(emailRegistroValido(12), null);
});

test("la vuelta del magic link apunta a la confirmación", () => {
  assert.equal(
    urlConfirmarAlertas("https://carreras.avilesia.es/"),
    "https://carreras.avilesia.es/alertas/confirmar",
  );
});
