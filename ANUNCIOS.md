# Anuncios y afiliados: interruptores

Orden de Javier (25-10-2026): Decathlon y Amazon fuera; AdSense preparado para apagarse. Cada proveedor tiene un interruptor.

- **Dónde se cambian:** en el Cuadro de Mandos, sección «Anuncios y afiliados» (solo admin). Por debajo es la tabla `public.anuncios_interruptores` de Supabase (proyecto fdpzepqhkdyfnorremce), con una fila `pre` y otra `pro` y las columnas `decathlon`, `amazon` y `adsense`. Lectura pública; escritura solo con service_role.
- **Estado inicial:** Decathlon off, Amazon off, AdSense on.
- **Si falla la lectura** (3 s como máximo): se aplica el respaldo, que es Decathlon off, Amazon off y AdSense on.
- **Código:**
  - `lib/interruptores-anuncios.ts`: lectura en el servidor (`leerInterruptores`, revalida cada 60 s; `VERCEL_ENV=production` lee `pro` y todo lo demás `pre`) y filtro de textos legales (`frasePermitida`).
  - `lib/use-interruptores.ts`: hook de cliente con caché de 5 min en sessionStorage. Devuelve `null` mientras carga, y en ese tiempo no se pinta nada.
- **Qué hace cada interruptor apagado:** el componente del proveedor devuelve `null` (sin enlace y sin hueco), AdSense no monta su cargador ni sus bloques in-feed, y las frases legales de ese proveedor desaparecen.
- **Se queda siempre:** `ads.txt` y la meta `google-adsense-account`.
- **Pruebas:** `lib/interruptores-anuncios.test.ts`.
