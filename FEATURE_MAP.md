# FEATURE_MAP

User-facing surfaces → how an agent reaches them. Routes below are from `app/` on this branch. Do not invent pages.

When you add a route, update this file in the same PR. Pair checks with agent skill `verify-ca-pre` and `npm run verify:smoke` (public PRO only).

## Pages (`app/**/page.tsx`)

| Route | What it is | How to reach |
| --- | --- | --- |
| `/` | Landing: choose a pie vs ciclismo | Header logo; default entry |
| `/correr` | Portal a pie (hero, tiras, mapa) | Nav **Correr**; landing **Entrar a correr** |
| `/ciclismo` | Portal bici | Nav **Ciclismo**; landing **Entrar a ciclismo** |
| `/correr/calendario` | Calendario solo a pie | Nav **Calendario** (desde correr); footer **Calendario a pie**; banner **Ver recién abiertas** / **Próximos 14 días** |
| `/ciclismo/calendario` | Calendario solo bici | Nav **Calendario** (desde ciclismo); footer **Calendario bici** |
| `/calendario` | Redirect helper → `/correr/calendario` (or `/ciclismo/calendario?…` if `?modalidad=ciclismo`) | Direct URL; not a nav item |
| `/evento/[id]` | Ficha de evento + bloque `#clasificacion` | Cards / hero / mapa on correr, ciclismo, calendarios |
| `/privacidad` | Política de privacidad | Footer **Privacidad** |
| `/cookies` | Política de cookies | Footer **Cookies** |
| `/aviso-legal` | Aviso legal | Footer **Aviso legal** |
| `/terminos` | Términos de uso | Footer **Términos** |
| `/vip/cancelar` | Baja VIP (Stripe test portal, noindex) | Direct URL only. Bloque `#vip` oculto en correr/ciclismo (Javier 2026-09-13) |
| `/interno/vip-push` | Internal OneSignal test (noindex, not in nav/footer) | Direct URL only |

There is **no** `app/vip/page.tsx`. `/vip` is 404. The `#vip` promo block is **not rendered** on `/correr` or `/ciclismo` (Javier 2026-09-13: quitar copy + CTA). `components/vip-promo.tsx` stays in the repo for restore.

## APIs (`app/api/**/route.ts`)

| Route | What it is |
| --- | --- |
| `GET /api/vip-cta` | `{ "count": number \| null }` — recuento de clics VIP |
| `POST /api/vip-cta` | Inserta un clic (`path`, `user_agent`) |
| `/api/vip/portal` | PRE: crea Billing Portal Session de Stripe test y redirige. Needs `STRIPE_SECRET_KEY` (test). Do not call in smoke against PRO as a success path. |

## Global chrome

- **Página en pruebas** (`components/pruebas-banner.tsx`): gold bar above the header on every page. Sticky with the header.

## Nav labels

- Header (`components/site-header.tsx`): **Correr**, **Ciclismo**, **Calendario**, **Mapa** (`/correr#mapa` or `/ciclismo#mapa`), **Menú** (mobile)
- Footer (`components/site-footer.tsx`): **Correr**, **Ciclismo**, **Calendario a pie**, **Calendario bici**, plus legal links
- Geo (`components/geo-button.tsx`): **📍 Encontrar carreras cerca de mí**
- VIP: bloque `#vip` oculto. No precio, no CTA, no «Próximamente» en correr/ciclismo.
- Clasificación (`lib/fin-estimado.ts`): al persistir una prueba con fecha se estima el fin a ritmo lento (a pie cola / bici cola de competición) + 30 min. **Esa hora** crea la rutina de buscar URL. Sigue 30 días en calendario/mapa. CTA **Inscribirme** → **Clasificación** (URL o `#clasificacion`). Ficha `#clasificacion`: **Ver clasificación** if URL; else «Se publica al acabar» / «Aún no publicada». Persistencia no borra antes de +30 d. No inventar URLs.
- Recién abierta (`lib/apertura-badge.ts`, Javier 2026-09-15): **máx 3 días** desde `fecha_apertura_inscripcion` (Europe/Madrid). Día 0 **Abierta hoy**; 1 **Abierta ayer**; 2–3 **🔥 ¡RECIÉN ABIERTA!**; ≥4 o sin fecha → sin badge / fuera del strip. No usar etiquetas ni el boolean `recien_abierta` si contradicen la fecha. Embargo VIP+24h (`lib/highlight-embargo.ts`) sigue ocultando hero/carrusel/🔥.
- Duplicados (`lib/portal-dedupe.ts`): hero, tiras y calendarios ocultan `duplicado_de`, alias de `PORTAL_DUPLICATE_OF` y probes `probe-ca-2026-09-14*`. La ficha alias redirige a la canónica.

## Verification

- `npm run lint`
- `npm run test:event-jsonld` (runs when `lib/sports-event-jsonld.test.ts` exists)
- `npm run verify:smoke` — public PRO (`https://www.carrerasasturias.es`). PRE `*.vercel.app` is behind Vercel Deployment Protection; Login–Vercel HTML is not success
- GitHub Actions: `.github/workflows/ci.yml`, job name **`ci`** (lint + JSON-LD test + build) on pull_request/push to `pre` and `main`
