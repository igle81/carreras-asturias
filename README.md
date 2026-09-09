# Carreras Asturias

Portal público del calendario de carreras a pie y ciclismo en Asturias. Lee en directo la tabla `public.eventos` de Supabase y destaca las inscripciones recién abiertas.

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
- Badge `🔥 ¡RECIÉN ABIERTA!` en ambas modalidades.

## Datos

Tabla `public.eventos`. Columnas clave: `id_canonico`, `nombre`, `fecha_inicio`, `municipio`, `disciplina_normalizada`, `modalidad` (opcional; la consulta reintenta sin ella si la columna no existe), `distancias`, `url_oficial`, `estado_inscripcion`, `lat`, `lng`, `etiquetas`, `recien_abierta` (generada), `calidad_score`.

## Canal VIP — checkout PRE y clics

En **PRE / preview / local** el bloque `#vip` de `/correr` y `/ciclismo` muestra **1,99 €/mes**, qué incluye (aviso la víspera, aviso el mismo día por Telegram VIP privado, push y correo), cupo 100 y **Cancelar suscripción**. El CTA es un enlace activo («Quiero el Canal VIP») que abre el Stripe **test** Payment Link en una pestaña nueva. Success/cancel se configuran en Stripe; la web no monta checkout embebido. **No hay enlace `t.me` ni invite permanente de Telegram.** En **producción (`VERCEL_ENV=production`)** el botón es siempre interés («Próximamente»): `getVipCheckoutUrl()` devuelve `null` aunque existan Payment Link, `VIP_CHECKOUT_URL` o `NEXT_PUBLIC_VIP_CHECKOUT_ENABLED`. No setear esas variables en el entorno Production de Vercel.

**Cancelar suscripción** va a `/vip/cancelar` (o a `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` / `VIP_CUSTOMER_PORTAL_URL` si está seteada). `/vip/cancelar` envía el email a `POST /api/vip/portal`, que busca el customer en Stripe test (`customer=cus_…` o email) y crea una Billing Portal Session. `return_url` vuelve al origen PRE (`/`). Si el portal de test no está activado en el Dashboard, la página muestra «Portal no activado aún». Si no hay customer, «necesitas una suscripción activa». No se inventan customers ni URLs de portal.

En Vercel PRE hay que setear `STRIPE_SECRET_KEY` = secret **test** (`sk_test_…`). Nunca live.

La URL se lee de `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` o `VIP_CHECKOUT_URL`. Si faltan, se usa el Payment Link de test **solo** cuando `NODE_ENV` es `development`/`test`, `VERCEL_ENV=preview`, la rama es `pre`, o `NEXT_PUBLIC_VIP_CHECKOUT_ENABLED=true` **fuera de Production**. Si `VERCEL_ENV` (o `NEXT_PUBLIC_VERCEL_ENV`) es `production`, el checkout queda forzado a `null`.

Cada clic (activo o «Próximamente»):

1. En modo interés (sin checkout): se queda en la página y muestra «Te avisaremos — llega en breve».
2. Inserta en `public.vip_cta_clicks` (`path`, `user_agent`; `clicked_at` lo pone la base) con el cliente Supabase anon ya usado para `eventos`. Es fire-and-forget: si la tabla o el RLS faltan, el botón no se bloquea.

`POST /api/vip-cta` hace el mismo insert (útil para pruebas). `GET /api/vip-cta` lee el recuento.

No hace falta login. No hay `service_role` en este repo (RLS: `INSERT` público, `SELECT` solo autenticado).

### Cómo ve Javier el recuento

Cualquiera de estas tres, en el proyecto Supabase `fdpzepqhkdyfnorremce`:

1. **Table Editor** → `vip_cta_clicks` → el contador de filas arriba a la izquierda.
2. **SQL Editor**: `select public.vip_cta_clicks_count();` (RPC anon, solo el número, sin filas).
3. En el portal desplegado: `GET /api/vip-cta` → `{ "count": 12 }`. Devuelve `{ "count": null }` si el RPC aún no existe.

No recrear el proyecto Vercel: el deploy existente coge la ruta `/api/vip-cta` en el siguiente build.
