import assert from "node:assert/strict";
import { test } from "node:test";
import { RUTA_PORTADA } from "./registro-alertas";
import { cerrarSesion } from "./sesion-cuenta";

test("salir cierra la sesión y vuelve a la portada", async () => {
  let cerrada = false;
  let destino = "";
  await cerrarSesion(
    {
      auth: {
        signOut: async () => {
          cerrada = true;
          return { error: null };
        },
      },
    },
    (ruta) => {
      destino = ruta;
    },
  );
  assert.equal(cerrada, true);
  assert.equal(destino, RUTA_PORTADA);
  assert.equal(destino, "/");
});

test("si el cierre falla no cambia de página", async () => {
  let destino = "";
  await assert.rejects(
    cerrarSesion(
      { auth: { signOut: async () => ({ error: { message: "red" } }) } },
      (ruta) => {
        destino = ruta;
      },
    ),
    /red/,
  );
  assert.equal(destino, "");
});
