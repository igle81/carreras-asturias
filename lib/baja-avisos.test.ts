import assert from "node:assert/strict";
import { test } from "node:test";
import { esBajaUnClic, htmlBaja, tokenBajaValido, tokenDeLaPeticion } from "./baja-avisos";

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCde";

test("el token es base64url de 43 caracteres", () => {
  assert.equal(TOKEN.length, 43);
  assert.equal(tokenBajaValido(TOKEN), true);
  assert.equal(tokenBajaValido(TOKEN + "x"), false);
  assert.equal(tokenBajaValido("<script>"), false);
  assert.equal(tokenBajaValido(null), false);
});

test("reconoce el POST de un clic de RFC 8058", () => {
  assert.equal(esBajaUnClic("List-Unsubscribe=One-Click"), true);
  assert.equal(esBajaUnClic("t=" + TOKEN), false);
});

test("el token sale del formulario o de la URL", () => {
  assert.equal(tokenDeLaPeticion(null, "t=" + TOKEN), TOKEN);
  assert.equal(tokenDeLaPeticion(TOKEN, "List-Unsubscribe=One-Click"), TOKEN);
  assert.equal(tokenDeLaPeticion("malo", "t=malo"), null);
});

test("el GET solo confirma: hay formulario POST y ningún script", () => {
  const html = htmlBaja("confirmar", TOKEN);
  assert.match(html, /<form method="post" action="\/avisos\/baja">/);
  assert.match(html, /name="t" value="AbCd/);
  assert.match(html, /name="ca-baja" content="1"/);
  assert.doesNotMatch(html, /<script/i);
});

test("la respuesta tras el POST no revela si el token existía", () => {
  assert.equal(htmlBaja("hecho", null), htmlBaja("hecho", TOKEN));
  assert.doesNotMatch(htmlBaja("hecho", null), /<form/);
});
