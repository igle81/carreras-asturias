import assert from "node:assert/strict";
import { test } from "node:test";
import { esEntornoPre } from "./entorno-pre";

test("sin variables no es PRE", () => {
  assert.equal(esEntornoPre({}), false);
  assert.equal(esEntornoPre({ NODE_ENV: "production" }), false);
  assert.equal(esEntornoPre({ NODE_ENV: "development" }), false);
  assert.equal(esEntornoPre({ VERCEL_ENV: "" }), false);
  assert.equal(esEntornoPre({ VERCEL_ENV: "development" }), false);
  assert.equal(esEntornoPre({ VERCEL_GIT_COMMIT_REF: "main" }), false);
});

test("producción no es PRE aunque la rama sea pre", () => {
  assert.equal(esEntornoPre({ VERCEL_ENV: "production" }), false);
  assert.equal(esEntornoPre({ NEXT_PUBLIC_VERCEL_ENV: "production" }), false);
  assert.equal(
    esEntornoPre({ VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "pre" }),
    false,
  );
  assert.equal(
    esEntornoPre({
      VERCEL_ENV: "preview",
      NEXT_PUBLIC_VERCEL_ENV: "production",
    }),
    false,
  );
});

test("vista previa y rama pre sí son PRE", () => {
  assert.equal(esEntornoPre({ VERCEL_ENV: "preview" }), true);
  assert.equal(esEntornoPre({ NEXT_PUBLIC_VERCEL_ENV: "preview" }), true);
  assert.equal(esEntornoPre({ VERCEL_ENV: "  preview  " }), true);
  assert.equal(esEntornoPre({ VERCEL_GIT_COMMIT_REF: "pre" }), true);
  assert.equal(esEntornoPre({ NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: "pre" }), true);
});
