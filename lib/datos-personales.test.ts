import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

/** SHA-256 de trozos de esos user_id (primer grupo de 8 y último de 12): detecta prefijos cortos tipo «6e0f…». */
const HASH_TROZOS_REALES = new Set([
  "99d45e3951c885856229f85029e717ec4d03779cdf21475142fdc24ee2d56ff0",
  "5e989b75fadeef42eaad5e13908fdf15e55af2efa72122f1110b00674fc2a647",
  "f27b1a40b989c3c7b35757e464acf4da8b39bf4702315437855d52248e2c17da",
  "778414be147b45a42882094c3799c15e3d20fa693ccd3b5eaf55395c8928da3d",
]);

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
/** UUID sin guiones (32 hex aislados). */
const UUID_SIN_GUIONES = /(?<![0-9a-z])[0-9a-f]{32}(?![0-9a-z])/gi;
/** Trozos hex aislados de 8 o 12 caracteres (también dentro de un UUID). */
const TROZO_HEX = /(?<![0-9a-z])(?:[0-9a-f]{8}|[0-9a-f]{12})(?![0-9a-z])/gi;
const conGuiones = (h: string) =>
  `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`.toLowerCase();
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

type Listar = (...args: string[]) => string[];
const listarConGit = (cwd?: string): Listar => (...args) =>
  execFileSync("git", ["ls-files", ...args], { encoding: "utf8", cwd }).split("\n");

/** Ficheros versionados y también los nuevos aún no añadidos a git (no ignorados). */
export function ficherosDelRepo(listar: Listar = listarConGit()): string[] {
  return [...new Set([...listar(), ...listar("--others", "--exclude-standard")])]
    .filter(Boolean)
    .filter((f) => f !== "package-lock.json" && !/\.(png|jpe?g|webp|gif|ico|woff2?|ttf|pdf)$/i.test(f));
}

/** Línea (1-based) de una posición del texto. */
const linea = (texto: string, i: number) => texto.slice(0, i).split("\n").length;
/**
 * I-c de Calidad (#128): la salida nunca muestra caracteres del identificador hallado,
 * solo el fichero, la línea y una huella corta (SHA-256) para poder compararlo sin verlo.
 */
const ref = (nombre: string, texto: string, i: number, valor: string) =>
  `${nombre}:${linea(texto, i)} (sha256 ${sha(valor).slice(0, 8)})`;

export function hallazgos(
  nombre: string,
  texto: string,
  hashes: { reales?: Set<string>; trozos?: Set<string> } = {},
): string[] {
  const reales = hashes.reales ?? HASH_USER_ID_REALES;
  const trozos = hashes.trozos ?? HASH_TROZOS_REALES;
  const fuera: string[] = [];
  for (const m of texto.matchAll(UUID)) {
    const u = m[0].toLowerCase();
    if (reales.has(sha(u))) fuera.push(`user_id real en ${ref(nombre, texto, m.index ?? 0, u)}`);
    else if (!UUID_PERMITIDOS.has(u)) fuera.push(`UUID fuera de la lista en ${ref(nombre, texto, m.index ?? 0, u)}`);
  }
  for (const m of texto.matchAll(UUID_SIN_GUIONES)) {
    const u = conGuiones(m[0]);
    if (!UUID_PERMITIDOS.has(u)) fuera.push(`UUID sin guiones en ${ref(nombre, texto, m.index ?? 0, u)}`);
  }
  for (const m of texto.matchAll(TROZO_HEX)) {
    const t = m[0].toLowerCase();
    if (trozos.has(sha(t))) fuera.push(`trozo de user_id real en ${ref(nombre, texto, m.index ?? 0, t)}`);
  }
  return fuera;
}

test("ningún UUID del repo está fuera de la lista blanca (con o sin guiones, ni trozos de user_id reales)", () => {
  const fuera: string[] = [];
  for (const f of ficherosDelRepo()) {
    let texto = "";
    try {
      texto = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    fuera.push(...hallazgos(f, texto));
  }
  assert.deepEqual(fuera, [], "UUID no permitidos (¿user_id real?)");
});

test("el filtro detecta UUID sin guiones y UUID fuera de la lista", () => {
  // Se montan en tiempo de ejecución para que este fichero no se detecte a sí mismo.
  const ajeno = ["1".repeat(8), "2".repeat(4), "4333", "8444", "5".repeat(12)];
  assert.equal(hallazgos("x", `id ${ajeno.join("")} fin`).length, 1);
  assert.equal(hallazgos("x", `id ${"0".repeat(12)}4000800000000000000${"1"} fin`).length, 0);
  assert.equal(hallazgos("x", ajeno.join("-")).length, 1);
  assert.equal(hallazgos("x", "sha 0123456789abcdef0123456789abcdef0123").length, 0, "un hash más largo no es un UUID");
});

test("la lista blanca no contiene user_id reales conocidos", () => {
  for (const u of UUID_PERMITIDOS.keys()) assert.equal(HASH_USER_ID_REALES.has(sha(u)), false, u.slice(0, 8));
  assert.equal(HASH_USER_ID_REALES.size, 2);
  assert.equal(HASH_TROZOS_REALES.size, 4);
  for (const u of UUID_PERMITIDOS.keys()) {
    assert.equal(HASH_TROZOS_REALES.has(sha(u.slice(0, 8))), false);
    assert.equal(HASH_TROZOS_REALES.has(sha(u.slice(-12))), false);
  }
});

test("I-b: el escaneo incluye los ficheros sin añadir a git (--others --exclude-standard)", () => {
  const llamadas: string[][] = [];
  const falso: Listar = (...args) => {
    llamadas.push(args);
    return args.includes("--others") ? ["nuevo.md", ""] : ["a.ts", "package-lock.json", "logo.png", ""];
  };
  assert.deepEqual(ficherosDelRepo(falso).sort(), ["a.ts", "nuevo.md"]);
  assert.deepEqual(llamadas, [[], ["--others", "--exclude-standard"]]);

  // Con git de verdad, en un repo temporal: el fichero sin añadir aparece y el ignorado no.
  const dir = mkdtempSync(join(tmpdir(), "datos-personales-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    writeFileSync(join(dir, ".gitignore"), "ignorado.txt\n");
    writeFileSync(join(dir, "sin-anadir.md"), "x");
    writeFileSync(join(dir, "ignorado.txt"), "x");
    const lista = ficherosDelRepo(listarConGit(dir));
    assert.ok(lista.includes("sin-anadir.md"), "el fichero sin añadir se escanea");
    assert.equal(lista.includes("ignorado.txt"), false, "lo ignorado por git no se escanea");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("I-b: la detección de trozos (8 y 12 hex) funciona con un hash inyectado", () => {
  // Trozos ficticios montados en ejecución (no son de nadie).
  const t8 = ["ab", "cd", "ef", "01"].join("");
  const t12 = ["fe", "dc", "ba", "98", "76", "54"].join("");
  const trozos = new Set([sha(t8), sha(t12)]);
  assert.equal(hallazgos("x", `prefijo ${t8}… y sufijo …${t12}`, { reales: new Set(), trozos }).length, 2);
  assert.equal(hallazgos("x", `prefijo ${t8.toUpperCase()}`, { reales: new Set(), trozos }).length, 1, "también en mayúsculas");
  assert.equal(hallazgos("x", `pegado x${t8}y`, { reales: new Set(), trozos }).length, 0, "solo trozos aislados");
  assert.equal(hallazgos("x", `prefijo ${t8}`, { reales: new Set(), trozos: new Set() }).length, 0);
});

test("I-c: la salida no muestra ningún carácter del identificador hallado", () => {
  const real = ["9", "a", "b", "c", "d", "e", "f", "7"].join("") + "-1234-4abc-8def-" + "0123456789ab";
  const t8 = real.slice(0, 8);
  const salida = hallazgos("f.md", `l1\nid ${real}\nprefijo ${t8}`, { reales: new Set([sha(real)]), trozos: new Set([sha(t8)]) });
  assert.equal(salida.length, 3); // UUID real, su trozo de 8 dentro del UUID y el prefijo suelto
  const texto = salida.join(" | ");
  for (const trozo of [real.slice(0, 4), real.slice(0, 8), real.slice(-4), real.slice(-12)]) {
    assert.equal(texto.includes(trozo), false, "no se imprime parte del user_id");
  }
  assert.match(salida[0], /^user_id real en f\.md:2 \(sha256 [0-9a-f]{8}\)$/);
});
