import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { POST } from "../app/api/interno/vip-push/route";
import { externalIdAdminParaSesion, MAX_BYTES_TOKEN, tokenConFormaJwt } from "./onesignal-admin";

const ADMIN = "00000000-0000-4000-8000-000000000001";
const EXTERNO = "00000000-0000-4000-8000-000000000002";
const OTRO = "00000000-0000-4000-8000-000000000003";
const ENV = { ONESIGNAL_ADMIN_EXTERNAL_ID: EXTERNO, ONESIGNAL_ADMIN_USER_ID: ADMIN };
const sesion = (id: string | null) => async () => id;
const T = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2ln";

test("solo la sesión del administrador recibe el external_id", async () => {
  assert.deepEqual(await externalIdAdminParaSesion(T, { env: ENV, userIdDeSesion: sesion(ADMIN) }), {
    ok: true,
    externalId: EXTERNO,
  });
  assert.deepEqual(await externalIdAdminParaSesion(T, { env: ENV, userIdDeSesion: sesion(ADMIN.toUpperCase()) }), {
    ok: true,
    externalId: EXTERNO,
  });
  const otro = await externalIdAdminParaSesion(T, { env: ENV, userIdDeSesion: sesion(OTRO) });
  assert.deepEqual(otro, { ok: false, status: 403, error: "no_autorizado" });
  assert.equal(JSON.stringify(otro).includes(EXTERNO), false);
});

test("sin token o con sesión inválida: 401 sin consultar la configuración", async () => {
  assert.deepEqual(await externalIdAdminParaSesion("  ", { env: ENV, userIdDeSesion: sesion(ADMIN) }), {
    ok: false,
    status: 401,
    error: "falta_sesion",
  });
  // I1: sin sesión válida no se revela si falta configuración (401, no 503).
  for (const env of [ENV, {}]) {
    assert.deepEqual(await externalIdAdminParaSesion(T, { env, userIdDeSesion: sesion(null) }), {
      ok: false,
      status: 401,
      error: "sesion_invalida",
    });
  }
});

test("con sesión válida y sin configuración: 503", async () => {
  for (const env of [{}, { ONESIGNAL_ADMIN_USER_ID: ADMIN }, { ...ENV, ONESIGNAL_ADMIN_EXTERNAL_ID: "no-uuid" }]) {
    assert.deepEqual(await externalIdAdminParaSesion(T, { env, userIdDeSesion: sesion(ADMIN) }), {
      ok: false,
      status: 503,
      error: "sin_configurar",
    });
  }
});

test("un token sin forma de JWT o de más de 4096 bytes no llega a Auth", async () => {
  let llamadas = 0;
  const contar = async () => {
    llamadas += 1;
    return ADMIN;
  };
  const grande = "a".repeat(2000) + "." + "b".repeat(2000) + "." + "c".repeat(200);
  assert.equal(Buffer.byteLength(grande) > MAX_BYTES_TOKEN, true);
  for (const malo of ["t", "a.b", "a.b.c.d", "a.b.c=", "a.b.c d", "a.b.\u00f1", "a+b.c.d", grande]) {
    assert.equal(tokenConFormaJwt(malo), false, malo.slice(0, 20));
    assert.deepEqual(await externalIdAdminParaSesion(malo, { env: ENV, userIdDeSesion: contar }), {
      ok: false,
      status: 401,
      error: "sesion_invalida",
    });
  }
  assert.equal(llamadas, 0);
  assert.equal(tokenConFormaJwt(T), true);
  assert.equal(tokenConFormaJwt("a".repeat(1000) + "." + "b".repeat(1000) + "." + "c".repeat(1000)), true);
});

test("I2: un token en la query string se rechaza (solo vale la cabecera Authorization)", async () => {
  for (const q of ["token", "access_token", "authorization"]) {
    const r = await POST(new Request(`https://www.carrerasasturias.es/api/interno/vip-push?${q}=${T}`, { method: "POST" }));
    assert.equal(r.status, 401);
    assert.equal(r.headers.get("cache-control"), "no-store");
    const cuerpo = (await r.json()) as { ok: boolean; error: string; externalId?: string };
    assert.deepEqual(cuerpo, { ok: false, error: "falta_sesion" });
  }
  const sinBearer = await POST(
    new Request("https://www.carrerasasturias.es/api/interno/vip-push", { method: "POST", headers: { authorization: T } }),
  );
  assert.equal(sinBearer.status, 401);
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
  assert.doesNotMatch(ruta, /searchParams|nextUrl|new URL\(/, "la ruta no lee la query string");
});
