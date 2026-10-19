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
| `/vip/cancelar` | Baja VIP (email → página de baja; noindex) | Direct URL only. Bloque `#vip` visible en correr/ciclismo; precio y cancelar siguen ocultos |
| `/interno/vip-push` | Internal OneSignal test (noindex, not in nav/footer) | Direct URL only |
| `/registro` | Crear una cuenta (correo, contraseña, correo de avisos, consentimiento). Sin campos en la portada | Cabecera: botón **Registro** |
| `/acceso` | Entrar a Mis avisos | Enlace desde el alta y desde **Mis avisos** si no hay sesión |
| `/avisos` | Mis avisos: correo (con **Volver a recibir avisos por correo** tras una baja, RPC `carreras.avisos_reactivar_correo`, solo la propia fila; queda en `carreras.consentimientos_log` con la versión del texto), Telegram (**Conectar** / **Volver a conectar** y **Desconectar**), Activar o desactivar avisos en este móvil, baja de todos los avisos y **Salir** separados | Cabecera: **Mis avisos** |
| `/alertas/confirmar` | Vuelta del magic link de avisos por correo (noindex) | Enlace del correo; no está en la navegación |

There is **no** `app/vip/page.tsx`. `/vip` is 404. The `#vip` promo block is rendered on `/correr` and `/ciclismo` (copy humano vendible). Price and «Cancelar suscripción» stay hidden (`SHOW_VIP_PRICE_AND_CANCEL = false`). Production checkout stays off (`getVipCheckoutUrl()` is null).

## APIs (`app/api/**/route.ts`)

| Route | What it is |
| --- | --- |
| `GET /api/vip-cta` | `{ "count": number \| null }` — recuento de clics VIP |
| `POST /api/vip-cta` | Registra un clic VIP por RPC (`ruta` validada y familia del navegador). Límite 30/min por IP. 400 si la ruta no vale, 429 si se pasa |
| `/api/vip/portal` | PRE: crea Billing Portal Session de Stripe test y redirige. Needs `STRIPE_SECRET_KEY` (test). Do not call in smoke against PRO as a success path. |
| `POST /api/alertas/suscribir` | Con el access token del magic link, inserta `carreras.suscripciones_alertas` si es un alta nueva y avisa al administrador solo por correo (sin Telegram ni push desde el 18-oct) |
| `POST /api/afiliado/clic` | Hook de clic Decathlon. Inserta en `control_flota_metricas` solo si esa tabla ya existe |

## Global chrome

- Header (`components/site-header.tsx`) is sticky at the top of every public page. There is no «En construcción» strip and no «Página en pruebas» banner (Javier, 2026-10-13).

## Nav labels

- Header (`components/site-header.tsx`): **Correr**, **Ciclismo**, **Calendario**, **Mapa** (`/correr#mapa` or `/ciclismo#mapa`), **Menú** (mobile)
- Mapa de banderillas (`components/mapa-carreras.tsx`): sustituye al mapa de círculos en `#mapa` (correr y ciclismo), en los calendarios y en la ficha. Ventana con nombre, tipo, fecha, ficha y cómo llegar. Atribución de OpenStreetMap en el mapa.
- Footer (`components/site-footer.tsx`): **Correr**, **Ciclismo**, **Calendario a pie**, **Calendario bici**, plus legal links
- Geo (`components/geo-button.tsx`): **📍 Encontrar carreras cerca de mí**
- Avisos (`components/activar-avisos.tsx`): **Activar avisos** en una fila de la cabecera y en la ficha. El SDK no se carga hasta el clic y, sin sesión, no se vincula a ningún `external_id` (tampoco al del administrador). En **Mis avisos**, con sesión, `external_id` = `user_id`. `/interno/vip-push` sigue siendo la prueba interna.
- Registro (`/registro`, botón **Registro** en la cabecera, sin campos en la portada): igual que asturRentIA en lo esencial. Cuenta con correo y contraseña, correo para los avisos y consentimiento. El alta manda `origen` = `window.location.origin` y Supabase recibe `emailRedirectTo` de ese origen más `/alertas/confirmar`. Los orígenes admitidos son `https://www.carrerasasturias.es`, `https://carrerasasturias.es`, los previews de Vercel y localhost. `POST /api/registro` con `seco: true` solo comprueba el origen y no crea cuenta. No usa el Site URL del proyecto (localhost, compartido). Telegram y el push no se piden en el alta: en **Mis avisos** están «Conectar Telegram» (`@AvilesIA_bot`, `start=ca_` + 36 hex) y «Activar avisos en este móvil» (OneSignal, `external_id` = `user_id`). `carreras.alertas_telegram_vincular` solo acepta ese prefijo. El webhook que hoy recibe el `/start` es el de alquileres (`POST /api/telegram/webhook`) y solo enruta `ar_`; hasta que esa ruta llame también a la función de Carreras, el chat no queda marcado. Si el alta ya trae sesión, el aviso al administrador sale entonces. Si el correo está pendiente, sale al confirmar en `/alertas/confirmar` (o al entrar en **Mis avisos** si la fila aún no existe). No es el canal VIP de pago.
- Publicidad: Consent Mode v2 denegado por defecto. El script de AdSense (`ca-pub-5660728155340779`) solo se descarga al pulsar Aceptar, y no en `/registro` ni `/avisos`. `public/ads.txt` sigue publicado. El `<ins>` entre tarjetas solo si hay consentimiento y `NEXT_PUBLIC_ADSENSE_SLOT`.
- Afiliación: bloque Decathlon con la etiqueta visible **Publicidad**, en `/correr`, `/correr/calendario` y fichas a pie. Enlace con `rel="sponsored noopener"` a la guía de trail (la ruta `all-sports/running-trail.html` responde 404) y `mc=AVILESIANETWORK`. El clic llama a `POST /api/afiliado/clic` con límite por IP; si no existe `control_flota_metricas`, la ruta deja de insistir. La marca se escribe «AvilesIA».
- Parte de AvilesIA: el bloque lee `https://avilesia.es/avilesia-apps.json` y no se incluye a sí mismo (hosts `www.carrerasasturias.es`, `carrerasasturias.es`, `carrerasasturias.avilesia.es`); `carreras.avilesia.es` es Carreras España y sí se muestra.
- Fichas celebradas: siguen accesibles e indexables (sin `noindex`). No entran en el sitemap. Las que no han acabado salen con prioridad `0.6`.
- VIP: bloque `#vip` visible. CTA «Avísame al abrir» + badge **Pronto**. No precio, no cancelar, no `t.me`.
- Clasificación (`lib/fin-estimado.ts`, `lib/clasificacion.ts`): al persistir una prueba con fecha se estima el fin a ritmo lento (a pie cola / bici cola de competición) + 30 min. **Esa hora** crea la rutina de buscar URL. Sigue **60 días** en calendario/mapa (`POST_RACE_RETENTION_DAYS`). CTA **Inscribirme** → **Clasificación** (URL o `#clasificacion`) mientras la prueba sigue listada. Si hay `url_clasificacion`, la tarjeta del listado muestra **Ver clasificación** (enlace externo), también cuando el CTA principal sigue siendo la inscripción. Ficha `#clasificacion`: **Ver clasificación** if URL; else «Se publica al acabar» / «Aún no publicada». En `/correr` y `/ciclismo` hay accesos **Cerradas** y **Con clasificación**. En los calendarios, los chips (`?cerradas=1`, `?clasificacion=1`) filtran dentro de esos 60 días y se combinan con el resto. La vista `public.eventos` puede no traer aún `url_clasificacion`: la carga reintenta sin esa columna. Persistencia no borra antes de +60 d. No inventar URLs.
- Recién abierta (`lib/apertura-badge.ts`, Javier 2026-09-15): badge **máx 3 días** desde `fecha_apertura_inscripcion` (Europe/Madrid). Día 0 **Abierta hoy**; 1 **Abierta ayer**; 2–3 **🔥 ¡RECIÉN ABIERTA!**; ≥4 o sin fecha → sin badge. No pintar badge si la hora/`apertura_inscripcion_at` es futura, ni si `estado_inscripcion` es `cerrada_pendiente_apertura` / `proximamente` (hasta que pase a `abierta` o `recien_abierta=true` en fila). El boolean `recien_abierta` no alarga la ventana de 3 días. El strip Recién abiertas (`entraEnStripRecienAbiertas`; /correr, /ciclismo y calendario `?recien=1`) entra **solo** si `estado_inscripcion = abierta`, `recien_abierta = true` y han pasado ≤3 días desde `fecha_apertura_inscripcion` (sin fechas futuras). No espera embargo VIP+24h. Embargo VIP+24h (`lib/highlight-embargo.ts`) sigue ocultando hero/carrusel/quincena.
- Duplicados (`lib/portal-dedupe.ts`): hero, tiras y calendarios ocultan `duplicado_de`, alias de `PORTAL_DUPLICATE_OF` y probes `probe-ca-2026-09-14*`. La ficha alias redirige a la canónica.

## Verification

- `npm run lint`
- `npm run test:event-jsonld` (runs when `lib/sports-event-jsonld.test.ts` exists)
- `npm run test:recien-abiertas` (strip: abierta + `recien_abierta` + ≤3 días)
- `npm run verify:smoke` — public PRO (`https://www.carrerasasturias.es`). Fails if «En construcción» or «Página en pruebas» appears on `/`, `/correr`, `/ciclismo`, the calendars, the legal pages, or one `/evento/<id>`. PRE `*.vercel.app` is behind Vercel Deployment Protection; Login–Vercel HTML is not success
- GitHub Actions: `.github/workflows/ci.yml`, job name **`ci`** (lint + JSON-LD test + build) on pull_request/push to `pre` and `main`
- Registro de consentimientos (19-10-2026, migración `20261018222605`): `carreras.consentimientos_log` (solo inserción: `user_id`, `accion` alta/baja/reactivar, `version`, `origen`, `creado_en`). Lo escribe el disparador `suscripciones_alertas_b_log_consentimiento` (SECURITY DEFINER) al dar de alta, al dar de baja en Mis avisos (`mis_avisos`) o con el enlace del correo (`enlace_correo`) y al reactivar (`mis_avisos_reactivar`). RLS sin políticas y sin grants; UPDATE bloqueado siempre y DELETE bloqueado para el cliente. Se borra con `purgar_bajas` y con la cuenta (`on delete cascade`). `suscripciones_alertas.consentimiento_version` = `PRIVACIDAD_VERSION` de `lib/legal.ts` (fecha de «Actualizado» de Privacidad), igual que `carreras.consentimiento_version_vigente()`; el disparador del alta la fija en el servidor. `avisos_baja_por_token` también da de baja con un token usado pero vigente si la fila está activa. Test: `lib/consentimientos-log.test.ts`.
- Telegram al reactivar y en la baja (W1 de Calidad, migración `20261018222953`): `avisos_reactivar_correo()` y el disparador del log borran la conexión de Telegram al volver por correo y al darse de baja (Mis avisos o enlace), en el momento; queda `consentimientos_log.detalle = telegram_desconectado`. La tarjeta lo dice bajo el botón (`TEXTO_ACEPTAS_REACTIVAR`). Textos pequeños de Mis avisos en `text-ink/70`.
