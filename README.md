# Carreras Asturias

Portal público del calendario de carreras a pie y ciclismo en Asturias. Lee en directo la vista `public.eventos` (schema real `carreras.eventos`) y destaca las inscripciones recién abiertas.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript) (anon, solo `SELECT`)
- Leaflet para el mapa

## Arranque local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Cómo verifican los agentes

Mapa de rutas: [`FEATURE_MAP.md`](./FEATURE_MAP.md). Checks:

```bash
npm run lint
npm run test:event-jsonld   # si existe lib/sports-event-jsonld.test.ts
npm run verify:smoke        # PRO público; no usar PRE vercel.app (SSO)
```

CI: `.github/workflows/ci.yml` (job `ci`). Skill de smoke en PRE: `verify-ca-pre`.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon pública (RLS: solo lectura) |
| `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` | URL de checkout VIP (PRE / preview). **No setear en Production** |
| `VIP_CHECKOUT_URL` | Alternativa server-only (PRE). **No setear en Production** |
| `NEXT_PUBLIC_VIP_CHECKOUT_ENABLED` | `true` fuerza el Payment Link de test en PRE si no hay URL. **No setear en Production** |
| `STRIPE_SECRET_KEY` | Secret de **test** (`sk_test_…`) en Vercel PRE. Nunca `sk_live_`. Hace falta para `/api/vip/portal` |
| `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` | Login URL del Customer Portal de test, si Stripe ya la ha generado. No inventar |
| `VIP_CUSTOMER_PORTAL_URL` | Alternativa server-only a la login URL del portal |

Valores del proyecto vivo:

```
NEXT_PUBLIC_SUPABASE_URL=https://fdpzepqhkdyfnorremce.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcHplcHFoa2R5Zm5vcnJlbWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDgwNDMsImV4cCI6MjEwMzUyNDA0M30.lQSPP9hx0341BjkRPg2ag06FCJYAPqU7uJVHKOHYkwY
```

En Vercel, enlaza las mismas variables en el proyecto. La app también usa estos valores como fallback de build para no romper el deploy si aún no están ligadas.

## Rutas

| Ruta | Qué es |
| --- | --- |
| `/` | Landing corta: **Carreras a pie** o **Ciclismo** |
| `/correr` | Portal a pie (`modalidad = pie`): hero, recién, quincena, mapa |
| `/ciclismo` | Portal de bici (`modalidad = ciclismo`) |
| `/correr/calendario` | Calendario solo a pie |
| `/ciclismo/calendario` | Calendario solo ciclismo |
| `/calendario` | Redirige al calendario de correr (o al de bici si `?modalidad=ciclismo`) |
| `/evento/[id]` | Ficha |
| `/vip/cancelar` | PRE: email → Customer Portal de Stripe (test). No indexar |
| `/api/vip/portal` | PRE: crea Billing Portal Session y redirige |

Correr y ciclismo **no se mezclan** en la misma vista. Cada portal tiene su hero (arrastre, swipe y flechas), tiras y mapa.

- Geolocalización: `📍 Encontrar carreras cerca de mí`.
- Badge `🔥 ¡RECIÉN ABIERTA!` en ambas modalidades (días 2–3 desde `fecha_apertura_inscripcion`; día 0 **Abierta hoy**, día 1 **Abierta ayer**; ≥4, sin fecha, hora futura o `cerrada_pendiente_apertura`: sin badge).

## Datos

Vista `public.eventos` → tabla `carreras.eventos`. Columnas clave: `id_canonico`, `nombre`, `fecha_inicio`, `municipio`, `disciplina_normalizada`, `modalidad` (opcional; la consulta reintenta sin ella si la columna no existe), `distancias`, `url_oficial`, `url_inscripcion`, `estado_inscripcion`, `fecha_apertura_inscripcion`, `hora_apertura_inscripcion`, `apertura_inscripcion_at`, `lat`, `lng`, `etiquetas`, `recien_abierta` (generada), `calidad_score`.

## Canal VIP — checkout PRE y clics

**Javier 2026-09-17:** el bloque `#vip` vuelve a `/correr` y `/ciclismo` con copy humano vendible (lead «Tranquilidad · cero esfuerzo», cupo «Solo 100 plazas…», CTA sin checkout «Avísame al abrir» + badge **Pronto**). Precio y «Cancelar suscripción» siguen ocultos. En producción el checkout sigue off.

**Javier 2026-09-09:** no enseñar precio (`1,99 €/mes`) ni «Cancelar suscripción» hasta OK. Re-activar UI comercial: `SHOW_VIP_PRICE_AND_CANCEL = true` en `components/vip-promo.tsx`. No inventar un precio nuevo.

En **PRE / preview / local** el CTA puede ser un enlace activo («Quiero el aviso VIP») al Stripe **test** Payment Link. **No hay enlace `t.me` ni invite permanente de Telegram.** En **producción (`VERCEL_ENV=production`)** `getVipCheckoutUrl()` devuelve `null` aunque existan Payment Link, `VIP_CHECKOUT_URL` o `NEXT_PUBLIC_VIP_CHECKOUT_ENABLED`. No setear esas variables en el entorno Production de Vercel.

La ruta `/vip/cancelar` sigue existiendo (PRE / test; no indexar) pero **no se enlaza** desde el bloque mientras el precio/cancelar estén ocultos. Si se reactiva «Cancelar suscripción», irá a `/vip/cancelar` (o a `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` / `VIP_CUSTOMER_PORTAL_URL` si está seteada). `/vip/cancelar` envía el email a `POST /api/vip/portal`. Copy de usuario: «No encontramos ese email» / «Ahora mismo no se puede abrir la baja; inténtalo más tarde». No se inventan customers ni URLs de portal.

En Vercel PRE hay que setear `STRIPE_SECRET_KEY` = secret **test** (`sk_test_…`). Nunca live.

La URL se lee de `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` o `VIP_CHECKOUT_URL`. Si faltan, se usa el Payment Link de test **solo** cuando `NODE_ENV` es `development`/`test`, `VERCEL_ENV=preview`, la rama es `pre`, o `NEXT_PUBLIC_VIP_CHECKOUT_ENABLED=true` **fuera de Production**. Si `VERCEL_ENV` (o `NEXT_PUBLIC_VERCEL_ENV`) es `production`, el checkout queda forzado a `null`.

Cada clic (activo o «Pronto»):

1. En modo interés (sin checkout): se queda en la página y muestra «Apuntado. Te avisamos cuando esté listo.»
2. Inserta en `public.vip_cta_clicks` (`path`, `user_agent`; `clicked_at` lo pone la base) con el cliente Supabase anon ya usado para `eventos`. Es fire-and-forget: si la tabla o el RLS faltan, el botón no se bloquea.

`POST /api/vip-cta` hace el mismo insert (útil para pruebas). `GET /api/vip-cta` lee el recuento.

No hace falta login. No hay `service_role` en este repo (RLS: `INSERT` público, `SELECT` solo autenticado).

### Cómo ve Javier el recuento

Cualquiera de estas tres, en el proyecto Supabase `fdpzepqhkdyfnorremce`:

1. **Table Editor** → `vip_cta_clicks` → el contador de filas arriba a la izquierda.
2. **SQL Editor**: `select public.vip_cta_clicks_count();` (RPC anon, solo el número, sin filas).
3. En el portal desplegado: `GET /api/vip-cta` → `{ "count": 12 }`. Devuelve `{ "count": null }` si el RPC aún no existe.

No recrear el proyecto Vercel: el deploy existente coge la ruta `/api/vip-cta` en el siguiente build.
