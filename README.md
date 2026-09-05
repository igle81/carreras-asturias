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

## Qué verás

- Home con carrusel (máx. 6), banner de recién abiertas, tira horizontal, «Esta quincena», mapa y bloque VIP.
- Geolocalización discreta: `📍 Encontrar carreras cerca de mí`. Si se concede, ordena por Haversine y muestra km. Si se deniega, filtra por concejo.
- Pestañas **Todas | A pie | Ciclismo** (home y `/calendario`). Filtran por `modalidad` (`pie` | `ciclismo`). Si el campo viene vacío, se infiere por `disciplina_normalizada`.
- `/calendario` con filtros: modalidad, recién abierta, ventana 14 días, disciplina, concejo y orden fecha/distancia.
- Ficha `/evento/[id]`.

## Datos

Tabla `public.eventos`. Columnas clave: `id_canonico`, `nombre`, `fecha_inicio`, `municipio`, `disciplina_normalizada`, `modalidad` (opcional; la consulta reintenta sin ella si la columna no existe), `distancias`, `url_oficial`, `estado_inscripcion`, `lat`, `lng`, `etiquetas`, `recien_abierta` (generada), `calidad_score`.
