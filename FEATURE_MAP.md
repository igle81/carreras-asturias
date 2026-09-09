# FEATURE_MAP

User-facing surfaces → how an agent reaches them. Routes below are from `app/` on this branch. Do not invent pages.

When you add a route, update this file in the same PR. Pair checks with agent skill `verify-ca-pre` and `npm run verify:smoke` (public PRO only).

## Pages (`app/**/page.tsx`)

| Route | What it is | How to reach |
| --- | --- | --- |
| `/` | Landing: choose a pie vs ciclismo | Header logo; default entry |
| `/correr` | Portal a pie (hero, tiras, mapa, VIP) | Nav **Correr**; landing **Entrar a correr** |
| `/ciclismo` | Portal bici | Nav **Ciclismo**; landing **Entrar a ciclismo** |
| `/correr/calendario` | Calendario solo a pie | Nav **Calendario** (desde correr); footer **Calendario a pie**; banner **Ver recién abiertas** / **Próximos 14 días** |
| `/ciclismo/calendario` | Calendario solo bici | Nav **Calendario** (desde ciclismo); footer **Calendario bici** |
| `/calendario` | Redirect helper → `/correr/calendario` (or `/ciclismo/calendario?…` if `?modalidad=ciclismo`) | Direct URL; not a nav item |
| `/evento/[id]` | Ficha de evento | Cards / hero / mapa on correr, ciclismo, calendarios |
| `/privacidad` | Política de privacidad | Footer **Privacidad** |
| `/cookies` | Política de cookies | Footer **Cookies** |
| `/aviso-legal` | Aviso legal | Footer **Aviso legal** |
| `/terminos` | Términos de uso | Footer **Términos** |
| `/vip/cancelar` | Baja VIP (Stripe test portal, noindex) | Direct URL only while `SHOW_VIP_PRICE_AND_CANCEL` is false (Javier 2026-09-09; no `#vip` cancel CTA) |
| `/interno/vip-push` | Internal OneSignal test (noindex, not in nav/footer) | Direct URL only |

There is **no** `app/vip/page.tsx`. `/vip` is 404. VIP CTA is the `#vip` block on `/correr` and `/ciclismo` (`components/vip-promo.tsx`, `id="vip"`).

## APIs (`app/api/**/route.ts`)

| Route | What it is |
| --- | --- |
| `GET /api/vip-cta` | `{ "count": number \| null }` — recuento de clics VIP |
| `POST /api/vip-cta` | Inserta un clic (`path`, `user_agent`) |
| `/api/vip/portal` | PRE: crea Billing Portal Session de Stripe test y redirige. Needs `STRIPE_SECRET_KEY` (test). Do not call in smoke against PRO as a success path. |

## Nav labels

- Header (`components/site-header.tsx`): **Correr**, **Ciclismo**, **Calendario**, **Mapa** (`/correr#mapa` or `/ciclismo#mapa`), **Menú** (mobile)
- Footer (`components/site-footer.tsx`): **Correr**, **Ciclismo**, **Calendario a pie**, **Calendario bici**, plus legal links
- Geo (`components/geo-button.tsx`): **📍 Encontrar carreras cerca de mí**
- VIP (`components/vip-promo.tsx`): **Quiero avisos VIP** (PRO, interés) / **Quiero el Canal VIP** (PRE checkout). Price and **Cancelar suscripción** hidden until Javier OK (`SHOW_VIP_PRICE_AND_CANCEL`)

## Verification

- `npm run lint`
- `npm run test:event-jsonld` (runs when `lib/sports-event-jsonld.test.ts` exists)
- `npm run verify:smoke` — public PRO (`https://www.carrerasasturias.es`). PRE `*.vercel.app` is behind Vercel Deployment Protection; Login–Vercel HTML is not success
- GitHub Actions: `.github/workflows/ci.yml`, job name **`ci`** (lint + JSON-LD test + build) on pull_request/push to `pre` and `main`
