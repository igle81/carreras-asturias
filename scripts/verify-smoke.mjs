#!/usr/bin/env node
/**
 * HTTP smoke checks against a public Carreras Asturias origin.
 *
 *   BASE_URL=https://www.carrerasasturias.es npm run verify:smoke
 *
 * Default BASE_URL is production (www). That origin is public.
 *
 * PRE (Vercel preview) is behind Deployment Protection (SSO). A 302 to
 * vercel.com/sso-api, a "Login – Vercel" HTML page, or any final URL that
 * leaves the site origin is a failure — never treat that HTML as a healthy
 * 200. Run this script against PRO, or a locally served `next start`.
 *
 * `/vip` is not a page (no app/vip/page.tsx). The VIP CTA is `#vip` on
 * `/correr` and `/ciclismo`. This script still requests `/vip` and records
 * the status; a 404 is accepted only when `/correr` contains id="vip".
 */

const DEFAULT_BASE_URL = "https://www.carrerasasturias.es";
const TITLE_NEEDLE = "Carreras Asturias";
const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT = "carreras-asturias-verify-smoke/1.0";

const PAGE_PATHS = [
  "/",
  "/correr",
  "/ciclismo",
  "/correr/calendario",
  "/ciclismo/calendario",
  "/calendario",
  "/privacidad",
  "/aviso-legal",
  "/cookies",
  "/terminos",
  "/vip",
];

const API_PATH = "/api/vip-cta";

function usageHint() {
  return [
    "BASE_URL must be a public origin.",
    "  PRO (default): https://www.carrerasasturias.es",
    "  PRE vercel.app is behind Vercel Deployment Protection (SSO).",
    "  Do not treat Login–Vercel HTML as success.",
  ].join("\n");
}

function parseBaseUrl(raw) {
  const value = (raw || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid BASE_URL: ${raw}\n${usageHint()}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`BASE_URL must be http(s): ${raw}`);
  }
  return url.origin;
}

function hostKey(hostname) {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function isSiteHost(finalUrl, baseOrigin) {
  try {
    const got = new URL(finalUrl);
    const expected = new URL(baseOrigin);
    return hostKey(got.hostname) === hostKey(expected.hostname);
  } catch {
    return false;
  }
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return "";
  return match[1].replace(/\s+/g, " ").trim();
}

function looksLikeVercelSso({ status, finalUrl, location, body, title }) {
  const blob = `${finalUrl}\n${location || ""}\n${title}\n${body}`.toLowerCase();
  if (blob.includes("vercel.com/sso") || blob.includes("vercel.com/login")) return true;
  if (blob.includes("_vercel_sso") || blob.includes("sso-api")) return true;
  const titleLower = title.toLowerCase();
  if (titleLower.includes("login") && titleLower.includes("vercel")) return true;
  if (status === 401 || status === 403) {
    if (blob.includes("vercel") && blob.includes("authentication")) return true;
  }
  return false;
}

async function fetchOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "User-Agent": USER_AGENT,
      },
    });
    const body = await response.text();
    return {
      status: response.status,
      finalUrl: response.url,
      location: response.headers.get("location"),
      contentType: response.headers.get("content-type") || "",
      body,
    };
  } catch (error) {
    const message = error?.name === "AbortError" ? `timeout after ${REQUEST_TIMEOUT_MS}ms` : error.message;
    throw new Error(`GET ${url} failed: ${message}`);
  } finally {
    clearTimeout(timer);
  }
}

function pad(value, width) {
  const text = String(value);
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

function printTable(rows) {
  const headers = ["PATH", "STATUS", "TITLE / NOTE", "RESULT"];
  const widths = [24, 8, 56, 8];
  for (const row of rows) {
    widths[0] = Math.max(widths[0], row.path.length);
    widths[1] = Math.max(widths[1], String(row.status).length);
    widths[2] = Math.max(widths[2], row.note.length);
    widths[3] = Math.max(widths[3], row.result.length);
  }
  const line = (cells) =>
    cells.map((cell, i) => pad(cell, widths[i])).join("  ");
  console.log(line(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) {
    console.log(line([row.path, row.status, row.note, row.result]));
  }
}

async function main() {
  const base = parseBaseUrl(process.env.BASE_URL);
  console.log(`verify:smoke  BASE_URL=${base}`);
  console.log(usageHint());
  console.log("");

  const rows = [];
  const failures = [];
  const bodies = new Map();

  for (const path of PAGE_PATHS) {
    const url = `${base}${path}`;
    let fetched;
    try {
      fetched = await fetchOnce(url);
    } catch (error) {
      rows.push({ path, status: "ERR", note: error.message, result: "FAIL" });
      failures.push(`${path}: ${error.message}`);
      continue;
    }

    const title = extractTitle(fetched.body);
    const sso = looksLikeVercelSso({ ...fetched, title });
    const onSite = isSiteHost(fetched.finalUrl, base);

    if (sso || !onSite) {
      const reason = sso
        ? "Vercel Deployment Protection / Login–Vercel HTML (not a page success)"
        : `left site origin → ${fetched.finalUrl}`;
      rows.push({ path, status: fetched.status, note: reason, result: "FAIL" });
      failures.push(`${path}: ${reason}`);
      continue;
    }

    bodies.set(path, fetched.body);

    const titleOk = title.includes(TITLE_NEEDLE);
    const ok200 = fetched.status === 200 && titleOk;

    if (path === "/vip" && fetched.status === 404) {
      rows.push({
        path,
        status: fetched.status,
        note: title || "no app/vip/page.tsx (VIP is /correr#vip)",
        result: "CHECK",
      });
      continue;
    }

    if (!ok200) {
      const reason = fetched.status !== 200
        ? `expected 200, got ${fetched.status}`
        : `title missing "${TITLE_NEEDLE}" (${title || "no <title>"})`;
      rows.push({ path, status: fetched.status, note: title || reason, result: "FAIL" });
      failures.push(`${path}: ${reason}`);
      continue;
    }

    rows.push({ path, status: fetched.status, note: title, result: "OK" });
  }

  const vipRow = rows.find((row) => row.path === "/vip");
  if (vipRow?.result === "CHECK") {
    const correr = bodies.get("/correr") || "";
    if (correr.includes('id="vip"')) {
      vipRow.note = '404 (no /vip page); /correr has id="vip"';
      vipRow.result = "OK";
    } else {
      vipRow.result = "FAIL";
      failures.push('/vip: 404 and /correr is missing id="vip"');
    }
  }

  let apiFetched;
  try {
    apiFetched = await fetchOnce(`${base}${API_PATH}`);
  } catch (error) {
    rows.push({ path: API_PATH, status: "ERR", note: error.message, result: "FAIL" });
    failures.push(`${API_PATH}: ${error.message}`);
    apiFetched = null;
  }

  if (apiFetched) {
    const apiSso = looksLikeVercelSso({ ...apiFetched, title: extractTitle(apiFetched.body) });
    const apiOnSite = isSiteHost(apiFetched.finalUrl, base);
    if (apiSso || !apiOnSite) {
      const reason = "Vercel Deployment Protection (API not reachable)";
      rows.push({ path: API_PATH, status: apiFetched.status, note: reason, result: "FAIL" });
      failures.push(`${API_PATH}: ${reason}`);
    } else if (apiFetched.status !== 200) {
      rows.push({
        path: API_PATH,
        status: apiFetched.status,
        note: `expected 200 JSON { count: number }`,
        result: "FAIL",
      });
      failures.push(`${API_PATH}: expected 200, got ${apiFetched.status}`);
    } else {
      let parsed;
      try {
        parsed = JSON.parse(apiFetched.body);
      } catch {
        parsed = null;
      }
      const count = parsed && typeof parsed.count === "number" && Number.isFinite(parsed.count)
        ? parsed.count
        : null;
      if (count === null) {
        const snippet = apiFetched.body.slice(0, 120).replace(/\s+/g, " ");
        rows.push({
          path: API_PATH,
          status: apiFetched.status,
          note: `JSON count is not numeric: ${snippet}`,
          result: "FAIL",
        });
        failures.push(`${API_PATH}: count is not a finite number`);
      } else {
        rows.push({
          path: API_PATH,
          status: apiFetched.status,
          note: `{"count":${count}}`,
          result: "OK",
        });
      }
    }
  }

  printTable(rows);
  console.log("");

  if (failures.length) {
    console.error(`verify:smoke failed (${failures.length})`);
    for (const line of failures) console.error(`  - ${line}`);
    process.exit(1);
  }

  console.log("verify:smoke ok");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
