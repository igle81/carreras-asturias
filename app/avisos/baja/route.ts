import { esBajaUnClic, htmlBaja, tokenBajaValido, tokenDeLaPeticion, type EstadoBaja } from "@/lib/baja-avisos";
import { crearLimiteIp, ipDeLaPeticion } from "@/lib/limite-ip";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Por IP: abrir el enlace y confirmar no debería pasar de unas pocas veces. */
const limiteVer = crearLimiteIp({ max: 30, ventanaMs: 10 * 60 * 1000 });
const limiteBaja = crearLimiteIp({ max: 10, ventanaMs: 10 * 60 * 1000 });

function responder(estado: EstadoBaja, token: string | null, status = 200) {
  return new Response(htmlBaja(estado, token), {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      // el token va en la URL: que no salga en el Referer
      "referrer-policy": "no-referrer",
    },
  });
}

/** GET: solo muestra la confirmación. No da de baja (los filtros de correo abren los enlaces solos). */
export async function GET(request: Request) {
  if (!limiteVer.contar(ipDeLaPeticion(request.headers)).permitido) {
    return responder("limite", null, 429);
  }
  const t = new URL(request.url).searchParams.get("t");
  return responder("confirmar", tokenBajaValido(t) ? t : null);
}

/** POST: formulario de confirmación o baja en un clic de RFC 8058. Misma respuesta exista o no el token. */
export async function POST(request: Request) {
  if (!limiteBaja.contar(ipDeLaPeticion(request.headers)).permitido) {
    return responder("limite", null, 429);
  }
  const cuerpo = (await request.text().catch(() => "")).slice(0, 2000);
  const token = tokenDeLaPeticion(new URL(request.url).searchParams.get("t"), cuerpo);
  if (token) {
    try {
      await getSupabase().schema("carreras").rpc("avisos_baja_por_token", { p_token: token });
    } catch {
      // misma respuesta: no se revela si el token existe ni si ha fallado
    }
  }
  if (esBajaUnClic(cuerpo)) {
    return new Response(null, { status: 200, headers: { "cache-control": "no-store" } });
  }
  return responder("hecho", null);
}
