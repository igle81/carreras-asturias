import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AFILIADO_APP_SLUG,
  AFILIADO_TIPO_EVENTO,
  DECATHLON_RUNNING_HREF,
  esTablaMetricasAusente,
  filaClicAfiliado,
  sanitizeAfiliadoPath,
} from "./afiliado";

test("el enlace de Decathlon es el de running y trail", () => {
  assert.equal(
    DECATHLON_RUNNING_HREF,
    "https://www.decathlon.es/es/all-sports/running-trail.html?mc=AVILESIANETWORK",
  );
});

test("el clic preparado usa app carreras y tipo clic_afiliado", () => {
  assert.deepEqual(filaClicAfiliado(), {
    app_slug: AFILIADO_APP_SLUG,
    tipo_evento: AFILIADO_TIPO_EVENTO,
  });
  assert.equal(AFILIADO_APP_SLUG, "carreras");
  assert.equal(AFILIADO_TIPO_EVENTO, "clic_afiliado");
});

test("una tabla ausente no se trata como un fallo de datos", () => {
  assert.equal(esTablaMetricasAusente({ code: "PGRST205", message: "could not find the table" }), true);
  assert.equal(esTablaMetricasAusente({ code: "42703", message: "column app_slug does not exist" }), true);
  assert.equal(esTablaMetricasAusente({ code: "42501", message: "permission denied" }), false);
});

test("la ruta del clic se queda en un path corto", () => {
  assert.equal(sanitizeAfiliadoPath("https://example.test"), "/");
  assert.equal(sanitizeAfiliadoPath("/correr"), "/correr");
});
