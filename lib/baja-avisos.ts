/**
 * Baja de los avisos sin iniciar sesión, con el token de un solo uso del pie del correo.
 * GET solo muestra la confirmación; el POST (formulario o RFC 8058 «List-Unsubscribe=One-Click»)
 * llama a carreras.avisos_baja_por_token. La respuesta es la misma exista o no el token.
 */

export const RUTA_BAJA_AVISOS = "/avisos/baja";

/** 32 bytes en base64url sin relleno, como los emite carreras.avisos_baja_token_emitir. */
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export function tokenBajaValido(valor: unknown): valor is string {
  return typeof valor === "string" && TOKEN_RE.test(valor);
}

/** Cuerpo del POST de un clic de RFC 8058. */
export function esBajaUnClic(cuerpo: string): boolean {
  const params = new URLSearchParams(cuerpo);
  return params.get("List-Unsubscribe") === "One-Click";
}

/** El token puede llegar en el formulario (campo t) o en la URL (?t=, el caso de RFC 8058). */
export function tokenDeLaPeticion(urlToken: string | null, cuerpo: string): string | null {
  const delCuerpo = new URLSearchParams(cuerpo).get("t");
  if (tokenBajaValido(delCuerpo)) return delCuerpo;
  if (tokenBajaValido(urlToken)) return urlToken;
  return null;
}

export type EstadoBaja = "confirmar" | "hecho" | "limite";

const TEXTOS: Record<EstadoBaja, { titulo: string; parrafo: string }> = {
  confirmar: {
    titulo: "Darte de baja de los avisos",
    parrafo:
      "Si confirmas, dejarás de recibir todos los avisos de Carreras Asturias: correo, notificaciones y Telegram. Si cambias de idea, puedes volver a recibir avisos por correo desde Mis avisos, con la sesión iniciada.",
  },
  hecho: {
    titulo: "Baja registrada",
    parrafo:
      "Si el enlace era válido, ya no recibirás avisos de Carreras Asturias por ningún canal. Puedes cerrar esta página.",
  },
  limite: {
    titulo: "Demasiados intentos",
    parrafo: "Espera unos minutos y vuelve a abrir el enlace del correo.",
  },
};

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Página mínima y autónoma: no carga scripts ni publicidad. */
export function htmlBaja(estado: EstadoBaja, token: string | null): string {
  const t = TEXTOS[estado];
  const formulario =
    estado === "confirmar"
      ? `<form method="post" action="${RUTA_BAJA_AVISOS}">` +
        (tokenBajaValido(token) ? `<input type="hidden" name="t" value="${escaparHtml(token)}">` : "") +
        `<button type="submit">Confirmar baja</button></form>`
      : "";
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="ca-baja" content="1">
<meta name="referrer" content="no-referrer">
<title>${escaparHtml(t.titulo)} · Carreras Asturias</title>
<style>
body{font-family:Arial,sans-serif;background:#f6f4ee;color:#1d2b20;margin:0;padding:48px 16px}
main{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e3e0d6}
h1{font-size:24px;margin:0 0 12px}p{line-height:1.5}
button{background:#1f5135;color:#fff;border:0;border-radius:999px;padding:12px 22px;font-size:15px;font-weight:bold;cursor:pointer}
a{color:#1f5135}
</style>
</head>
<body><main>
<h1>${escaparHtml(t.titulo)}</h1>
<p>${escaparHtml(t.parrafo)}</p>
${formulario}
<p style="font-size:13px;color:#666;margin-top:24px">También puedes cambiar tus avisos canal a canal en <a href="/avisos">Mis avisos</a>, con la sesión iniciada. <a href="/privacidad">Privacidad</a>.</p>
</main></body>
</html>`;
}
