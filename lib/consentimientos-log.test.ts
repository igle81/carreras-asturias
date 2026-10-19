import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LEGAL_DOCUMENTS, PRIVACIDAD_VERSION } from "./legal";

const MIGRACION = readFileSync(
  new URL("../supabase/migrations/20261018222605_carreras_consentimientos_log.sql", import.meta.url),
  "utf8",
);
const sinComentarios = MIGRACION.split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n");

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

test("PRIVACIDAD_VERSION es la fecha de «Actualizado» de la Política de privacidad", () => {
  const [a, m, d] = PRIVACIDAD_VERSION.split("-").map(Number);
  assert.equal(LEGAL_DOCUMENTS.privacidad.updatedLabel, `Actualizado ${d} de ${MESES[m - 1]} de ${a}`);
});

test("la versión de Supabase coincide con la del código", () => {
  const m = sinComentarios.match(/consentimiento_version_vigente\(\)[\s\S]*?select '([^']+)'::text/);
  assert.ok(m, "no encuentro consentimiento_version_vigente()");
  assert.equal(m[1], PRIVACIDAD_VERSION);
});

test("el log es de solo inserción y el cliente no tiene permisos", () => {
  assert.match(sinComentarios, /create table if not exists carreras\.consentimientos_log/);
  assert.match(sinComentarios, /accion in \('alta', 'baja', 'reactivar'\)/);
  assert.match(sinComentarios, /references auth\.users \(id\) on delete cascade/);
  assert.match(sinComentarios, /alter table carreras\.consentimientos_log enable row level security/);
  assert.match(
    sinComentarios,
    /revoke all on table carreras\.consentimientos_log from public, anon, authenticated, service_role/,
  );
  assert.doesNotMatch(sinComentarios, /grant [a-z, ]+ on (table )?carreras\.consentimientos_log/);
  assert.match(sinComentarios, /before update or delete on carreras\.consentimientos_log/);
  assert.match(sinComentarios, /if tg_op = 'UPDATE' then\s+raise exception/);
});

test("alta, baja (Mis avisos y enlace) y reactivar quedan en el log", () => {
  assert.match(sinComentarios, /after insert or update of baja_en on carreras\.suscripciones_alertas/);
  for (const accion of ["alta", "baja", "reactivar"]) {
    assert.match(sinComentarios, new RegExp(`values \\(new\\.user_id, '${accion}'`));
  }
  assert.match(sinComentarios, /set_config\('carreras\.consentimiento_origen', 'enlace_correo', true\)/);
  assert.match(sinComentarios, /set_config\('carreras\.consentimiento_origen', 'mis_avisos_reactivar', true\)/);
  assert.match(sinComentarios, /consentimiento_version = carreras\.consentimiento_version_vigente\(\)/);
  assert.match(sinComentarios, /new\.consentimiento_version := carreras\.consentimiento_version_vigente\(\)/);
});

test("reactivar sigue sin parámetros, solo auth.uid() y sin anon", () => {
  assert.match(sinComentarios, /create or replace function carreras\.avisos_reactivar_correo\(\)\s+returns boolean/);
  assert.match(sinComentarios, /v_uid uuid := auth\.uid\(\)/);
  assert.match(sinComentarios, /revoke all on function carreras\.avisos_reactivar_correo\(\) from public, anon;/);
});

test("la purga borra el log y ya no dice que la baja sea irreversible", () => {
  assert.match(sinComentarios, /delete from carreras\.consentimientos_log c where c\.user_id = any \(v_ids\)/);
  assert.match(sinComentarios, /consentimiento_version = null/);
  assert.doesNotMatch(MIGRACION, /la baja sigue siendo irreversible/);
  assert.doesNotMatch(MIGRACION, /global e irreversible/);
});

test("R3: token usado pero vigente da de baja si la fila sigue activa", () => {
  assert.match(sinComentarios, /if v_caduca < now\(\) then\s+[\s\S]*?return v_usado is not null;/);
  assert.match(sinComentarios, /if v_usado is not null and not exists \([\s\S]*?s\.baja_en is null\s+\) then\s+return true;/);
});

test("las dos altas mandan la versión del texto", () => {
  for (const f of ["./suscripcion-alertas.ts", "./cuenta-alertas.ts"]) {
    const src = readFileSync(new URL(f, import.meta.url), "utf8");
    assert.match(src, /consentimiento_version: PRIVACIDAD_VERSION,/, f);
  }
});

test("Privacidad explica el registro y qué se recupera tras la purga", () => {
  const texto = JSON.stringify(LEGAL_DOCUMENTS.privacidad);
  assert.match(texto, /Registro de consentimientos/);
  assert.match(texto, /Si vuelves tras la purga, solo recuperamos el correo de tu cuenta\./);
});

const W1 = readFileSync(
  new URL("../supabase/migrations/20261018222953_carreras_reactivar_sin_telegram.sql", import.meta.url),
  "utf8",
);

test("W1: reactivar y la baja desconectan Telegram y lo apuntan en el log", () => {
  assert.match(W1, /delete from carreras\.alertas_telegram where user_id = v_uid;/);
  assert.equal((W1.match(/delete from carreras\.alertas_telegram t where t\.user_id = new\.user_id;/g) ?? []).length, 2);
  assert.match(W1, /'telegram_desconectado'/);
  assert.match(W1, /create or replace function carreras\.avisos_reactivar_correo\(\)\s+returns boolean/);
  assert.match(W1, /revoke all on function carreras\.avisos_reactivar_correo\(\) from public, anon;/);
});

test("W1/W2: la tarjeta avisa de Telegram y el texto pequeño usa text-ink/70", () => {
  const src = readFileSync(new URL("../components/mis-avisos.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(src, /text-ink\/60/);
  assert.match(src, /\{TEXTO_ACEPTAS_REACTIVAR\}/);
  const textos = readFileSync(new URL("./mis-avisos.ts", import.meta.url), "utf8");
  assert.match(textos, /Telegram queda desconectado/);
});

test("W3: Privacidad ya no dice que Telegram espere a la pasada diaria tras la baja", () => {
  const texto = JSON.stringify(LEGAL_DOCUMENTS.privacidad);
  assert.doesNotMatch(texto, /en la pasada diaria, como máximo en 24 horas, si lo haces en Mis avisos/);
  assert.match(texto, /al volver a recibir avisos por correo tras una baja \(Telegram queda desconectado/);
});

const C1 = readFileSync(
  new URL("../supabase/migrations/20261018224933_carreras_consentimientos_reconstruidos.sql", import.meta.url),
  "utf8",
);

test("C2: las migraciones desde 20261018224933 llevan lock_timeout", async () => {
  const { readdirSync } = await import("node:fs");
  const dir = new URL("../supabase/migrations/", import.meta.url);
  const nuevas = readdirSync(dir).filter((f) => f.endsWith(".sql") && f >= "20261018224933");
  assert.ok(nuevas.length >= 1);
  for (const f of nuevas) {
    assert.match(readFileSync(new URL(f, dir), "utf8"), /^set local lock_timeout = '5s';$/m, f);
  }
});

test("C1: las 4 filas rellenadas se marcan reconstruidas con el disparador desactivado solo en la transacción", () => {
  assert.match(C1, /add column if not exists reconstruido boolean not null default false/);
  const off = C1.indexOf("disable trigger consentimientos_log_solo_insercion");
  const on = C1.indexOf("enable trigger consentimientos_log_solo_insercion");
  assert.ok(off > 0 && on > off, "desactivar y volver a activar, en ese orden");
  assert.equal((C1.match(/disable trigger/g) ?? []).length, 1);
  assert.match(C1, /if t <> 4 then\s+raise exception/);
  assert.match(C1, /'2026-10-18 22:03:10\.482\+00'/);
  assert.match(C1, /hora aprox\. = actualizado_en \(lo puede escribir el cliente\)/);
});

test("C3: el origen es una lista cerrada y el alta del cliente es siempre 'web'", () => {
  assert.match(C1, /constraint consentimientos_log_origen_lista/);
  assert.match(C1, /new\.origen := 'web';/);
  assert.match(C1, /values \(new\.user_id, 'alta', new\.consentimiento_version, coalesce\(v_origen, 'web'\)\)/);
  assert.doesNotMatch(C1.split("C3)")[1] ?? "", /new\.origen, 'web'/);
});

test("F1 e Info: tope de 4096 bytes en los filtros y la purga los vacía", () => {
  assert.match(C1, /check \(octet_length\(filtros_avisos::text\) <= 4096 and carreras\.filtros_avisos_validos\(filtros_avisos\)\)/);
  assert.match(C1, /filtros_avisos = '\{\}'::jsonb,/);
});

test("el relleno inicial queda en docs y avisa de que no se repite", () => {
  const doc = readFileSync(new URL("../docs/consentimientos-relleno-2026-10-19.sql", import.meta.url), "utf8");
  assert.match(doc, /NO volver a ejecutar/);
});
