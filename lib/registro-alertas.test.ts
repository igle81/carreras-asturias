import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ALERTAS_CONFIRMAR_PATH,
  AUTH_REDIRECT_URLS_CARRERAS,
  avisarAdminAlCrearCuenta,
  cuentaRegistroValida,
  codigoTelegramCarrerasValido,
  emailRegistroValido,
  instagramRegistro,
  nombreRegistroValido,
  origenConfirmacionPermitido,
  redirectConfirmacionCarreras,
  resolverDatosAlta,
  RUTA_ACCESO,
  RUTA_AVISOS,
  RUTA_REGISTRO,
  urlConfirmarAlertas,
  urlTelegramBot,
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

test("la cuenta pide correo, contraseña y consentimiento, y el aviso puede ser otro correo", () => {
  assert.equal(
    cuentaRegistroValida({ correo: "Ana@Ejemplo.es", password: "corta", consentimiento: true }).ok,
    false,
  );
  assert.equal(
    cuentaRegistroValida({ correo: "ana@ejemplo.es", password: "secreto88", consentimiento: false }).ok,
    false,
  );
  assert.deepEqual(
    cuentaRegistroValida({
      correo: " Ana@Ejemplo.es ",
      password: "secreto88",
      correoAvisos: "",
      consentimiento: true,
    }),
    { ok: true, cuenta: { correo: "ana@ejemplo.es", password: "secreto88", correoAvisos: "ana@ejemplo.es" } },
  );
  const otro = cuentaRegistroValida({
    correo: "ana@ejemplo.es",
    password: "secreto88",
    correoAvisos: "Avisos@Ejemplo.es",
    consentimiento: true,
  });
  assert.equal(otro.ok && otro.cuenta.correoAvisos, "avisos@ejemplo.es");
});

test("el código de Telegram de Carreras lleva el prefijo ca_ y el de alquileres no vincula", () => {
  const hex = "a".repeat(36);
  assert.equal(codigoTelegramCarrerasValido(`ca_${hex}`), true);
  assert.equal(codigoTelegramCarrerasValido(hex), false);
  assert.equal(codigoTelegramCarrerasValido(`ar_${hex}`), false);
  assert.equal(urlTelegramBot(`ca_${hex}`), `https://t.me/AvilesIA_bot?start=ca_${hex}`);
});

test("el botón de registro no lleva campos y Telegram abre el bot", () => {
  assert.equal(RUTA_REGISTRO, "/registro");
  assert.equal(RUTA_ACCESO, "/acceso");
  assert.equal(RUTA_AVISOS, "/avisos");
  assert.equal(ALERTAS_CONFIRMAR_PATH, "/alertas/confirmar");
  assert.equal(urlTelegramBot("ca_" + "ab".repeat(18)), "https://t.me/AvilesIA_bot?start=ca_" + "ab".repeat(18));
});

test("la vuelta del magic link apunta a la confirmación", () => {
  assert.equal(
    urlConfirmarAlertas("https://carreras.avilesia.es/"),
    "https://carreras.avilesia.es/alertas/confirmar",
  );
});

test("el correo de confirmación usa el origen del navegador y la ruta de Carreras", () => {
  assert.equal(
    redirectConfirmacionCarreras("https://www.carrerasasturias.es"),
    "https://www.carrerasasturias.es/alertas/confirmar",
  );
  assert.equal(
    redirectConfirmacionCarreras("https://carrerasasturias.es"),
    "https://carrerasasturias.es/alertas/confirmar",
  );
  assert.equal(
    redirectConfirmacionCarreras("https://carreras.avilesia.es"),
    "https://carreras.avilesia.es/alertas/confirmar",
  );
  assert.equal(
    redirectConfirmacionCarreras("https://carreras-asturias-77mlfbc3h-javiers-projects-32052beb.vercel.app"),
    "https://carreras-asturias-77mlfbc3h-javiers-projects-32052beb.vercel.app/alertas/confirmar",
  );
  assert.equal(redirectConfirmacionCarreras("http://localhost:3000"), "http://localhost:3000/alertas/confirmar");
  assert.equal(redirectConfirmacionCarreras("http://127.0.0.1:3000"), "http://127.0.0.1:3000/alertas/confirmar");
  assert.equal(redirectConfirmacionCarreras("http://localhost:3000"), redirectConfirmacionCarreras("http://localhost:3000/"));
  assert.equal(origenConfirmacionPermitido("https://evil.example"), false);
  assert.equal(origenConfirmacionPermitido("https://carreras.avilesia.es.evil.com"), false);
  assert.equal(origenConfirmacionPermitido("https://www.carrerasasturias.es.evil.com"), false);
  assert.equal(origenConfirmacionPermitido("http://www.carrerasasturias.es"), false);
  assert.equal(origenConfirmacionPermitido("http://carreras.avilesia.es"), false);
  assert.equal(origenConfirmacionPermitido("https://otro-proyecto.vercel.app"), false);
  assert.equal(redirectConfirmacionCarreras("http://localhost:3000/acceso"), null);
  assert.deepEqual(AUTH_REDIRECT_URLS_CARRERAS, [
    "https://www.carrerasasturias.es/**",
    "https://carrerasasturias.es/**",
    "https://carreras.avilesia.es/**",
    "https://*-javiers-projects-32052beb.vercel.app/**",
    "http://localhost:3000/**",
    "http://127.0.0.1:3000/**",
  ]);
});

test("el aviso al administrador espera a la confirmación si aún no hay sesión", () => {
  assert.equal(avisarAdminAlCrearCuenta(false), false);
  assert.equal(avisarAdminAlCrearCuenta(true), true);
});
