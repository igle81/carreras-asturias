import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { externalIdAdminParaSesion } from "./onesignal-admin";

const ADMIN = "00000000-0000-4000-8000-000000000001";
const EXTERNO = "00000000-0000-4000-8000-000000000002";
const OTRO = "00000000-0000-4000-8000-000000000003";
const ENV = { ONESIGNAL_ADMIN_EXTERNAL_ID: EXTERNO, ONESIGNAL_ADMIN_USER_ID: ADMIN };
const sesion = (id: string | null) => async () => id;

test("solo la sesión del administrador recibe el external_id", async () => {
  assert.deepEqual(await externalIdAdminParaSesion("t", { env: ENV, userIdDeSesion: sesion(ADMIN) }), {
    ok: true,
    externalId: EXTERNO,
  });
  assert.deepEqual(await externalIdAdminParaSesion("t", { env: ENV, userIdDeSesion: sesion(ADMIN.toUpperCase()) }), {
    ok: true,
    externalId: EXTERNO,
  });
  const otro = await externalIdAdminParaSesion("t", { env: ENV, userIdDeSesion: sesion(OTRO) });
  assert.deepEqual(otro, { ok: false, status: 403, error: "no_autorizado" });
  assert.equal(JSON.stringify(otro).includes(EXTERNO), false);
});

test("sin token, con sesión inválida o sin configurar no se entrega", async () => {
  let llamadas = 0;
  const contar = async () => {
    llamadas += 1;
    return ADMIN;
  };
  assert.deepEqual(await externalIdAdminParaSesion("  ", { env: ENV, userIdDeSesion: contar }), {
    ok: false,
    status: 401,
    error: "falta_sesion",
  });
  assert.deepEqual(await externalIdAdminParaSesion("t", { env: ENV, userIdDeSesion: sesion(null) }), {
    ok: false,
    status: 401,
    error: "sesion_invalida",
  });
  for (const env of [{}, { ONESIGNAL_ADMIN_USER_ID: ADMIN }, { ...ENV, ONESIGNAL_ADMIN_EXTERNAL_ID: "no-uuid" }]) {
    assert.deepEqual(await externalIdAdminParaSesion("t", { env, userIdDeSesion: contar }), {
      ok: false,
      status: 503,
      error: "sin_configurar",
    });
  }
  assert.equal(llamadas, 0, "sin configuración no se consulta Auth");
});

test("el external_id del administrador no llega al cliente", () => {
  const web = readFileSync("lib/onesignal-web.ts", "utf8");
  const componente = readFileSync("components/vip-push-test.tsx", "utf8");
  const ejemplo = readFileSync(".env.example", "utf8");
  assert.doesNotMatch(web + componente + ejemplo, /NEXT_PUBLIC_ONESIGNAL_(ADMIN_)?EXTERNAL_ID/);
  assert.doesNotMatch(web, /EXTERNAL_ID|IDENTIFICADOR_EXTERNO/);
  assert.doesNotMatch(componente, /onesignal-admin|process\.env/);
  assert.match(componente, /fetch\("\/api\/interno\/vip-push"/);
  assert.match(readFileSync("lib/onesignal-admin.ts", "utf8"), /const VARIABLE_EXTERNAL_ID_ADMIN = "ONESIGNAL_ADMIN_EXTERNAL_ID"/);
  const ruta = readFileSync("app/api/interno/vip-push/route.ts", "utf8");
  assert.match(ruta, /export async function POST/);
  assert.match(ruta, /"cache-control": "no-store"/);
  assert.doesNotMatch(ruta, /export async function GET/);
});
