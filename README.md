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

Correr y ciclismo **no se mezclan** en la misma vista. Cada portal tiene su hero (arrastre, swipe y flechas), tiras y mapa.

- Geolocalización: `📍 Encontrar carreras cerca de mí`.
- Badge `🔥 ¡RECIÉN ABIERTA!` en ambas modalidades.

## Datos

Tabla `public.eventos`. Columnas clave: `id_canonico`, `nombre`, `fecha_inicio`, `municipio`, `disciplina_normalizada`, `modalidad` (opcional; la consulta reintenta sin ella si la columna no existe), `distancias`, `url_oficial`, `estado_inscripcion`, `lat`, `lng`, `etiquetas`, `recien_abierta` (generada), `calidad_score`.

## Canal VIP — clics de interés

El botón **Quiero el Canal VIP** (`#vip` en `/correr` y `/ciclismo`) no abre Telegram: el canal aún no existe. Cada clic:

1. Se queda en la sección VIP y muestra «Te avisaremos — canal en breve».
2. Registra un evento en `public.vip_cta_clicks` (`clicked_at`, `path`, `user_agent`) vía `POST /api/vip-cta` (fire-and-forget; si la tabla o el RLS aún no están, la UI no se rompe).

No hace falta login. No hay `service_role` en este repo: el insert usa la clave anon (RLS: `INSERT` público, `SELECT` solo autenticado).

### Cómo ve Javier el recuento

Cualquiera de estas tres, en el proyecto Supabase `fdpzepqhkdyfnorremce`:

1. **Table Editor** → `vip_cta_clicks` → el contador de filas arriba a la izquierda.
2. **SQL Editor**: `select public.vip_cta_clicks_count();` (RPC anon, solo el número, sin filas).
3. En el portal desplegado: `GET /api/vip-cta` → `{ "count": 12 }`. Devuelve `{ "count": null }` si el RPC aún no existe.

No recrear el proyecto Vercel: el deploy existente coge la ruta `/api/vip-cta` en el siguiente build.
