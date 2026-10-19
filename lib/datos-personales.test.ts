import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * WARN-2 de Seguridad (19-10-2026): en el repo (público) no puede haber user_id reales.
 * Cualquier UUID de los ficheros versionados tiene que estar en esta lista blanca de identificadores
 * que no son personas de Auth. Si añades uno nuevo, explica aquí qué es.
 */
const UUID_PERMITIDOS = new Map<string, string>([
  ["12796c96-a5cd-4db3-af58-584c429ce188", "app_id público de OneSignal (lib/onesignal-web.ts)"],
  ["daac61c5-1687-4240-addd-60825b6f8354", "id de categoría de Decathlon en el enlace de afiliado"],
  ["00000000-0000-4000-8000-000000000001", "usuario ficticio de los tests"],
  ["00000000-0000-4000-8000-000000000002", "external_id ficticio de los tests"],
  ["00000000-0000-4000-8000-000000000003", "otro usuario ficticio de los tests"],
]);

/** SHA-256 de user_id reales conocidos (no en claro), por si alguien los añade a la lista blanca por error. */
const HASH_USER_ID_REALES = new Set([
  "8d8c62e613d855bc09ee78f012e0a944c15bd389bf74d0e560ffe2208ed8b64d",
  "3cdc7f38d1939d88e493a6fd35a266263d5c4800a14464ba006597ab068bb84d",
]);

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

function ficherosVersionados(): string[] {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter((f) => f !== "package-lock.json" && !/\.(png|jpe?g|webp|gif|ico|woff2?|ttf|pdf)$/i.test(f));
}

test("ningún UUID del repo está fuera de la lista blanca", () => {
  const fuera: string[] = [];
  for (const f of ficherosVersionados()) {
    let texto = "";
    try {
      texto = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    for (const m of texto.matchAll(UUID)) {
      const u = m[0].toLowerCase();
      if (!UUID_PERMITIDOS.has(u)) fuera.push(`${f}: ${u.slice(0, 8)}…`);
    }
  }
  assert.deepEqual(fuera, [], "UUID no permitidos (¿user_id real?)");
});

test("la lista blanca no contiene user_id reales conocidos", () => {
  for (const u of UUID_PERMITIDOS.keys()) assert.equal(HASH_USER_ID_REALES.has(sha(u)), false, u.slice(0, 8));
  assert.equal(HASH_USER_ID_REALES.size, 2);
});
