import { NextResponse } from "next/server";
import { crearCuentaAlertas } from "@/lib/cuenta-alertas";
import { MENSAJE_ALTA_GENERICO } from "@/lib/registro-alertas";
import { ipDeLaPeticion, limiteRegistro } from "@/lib/limite-ip";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = ipDeLaPeticion(request.headers);
  if (!limiteRegistro.contar(ip).permitido) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Espera un poco y vuelve a probar." },
      { status: 429 },
    );
  }

  const entrada = await request.json().catch(() => ({}));
  const resultado = await crearCuentaAlertas(entrada, request.headers.get("origin"));
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, { status: resultado.status });
  }
  if ("seco" in resultado) {
    return NextResponse.json({ ok: true, seco: true, redirect: resultado.redirect });
  }
  return NextResponse.json({
    ok: true,
    confirmarCorreo: resultado.confirmarCorreo,
    mensaje: MENSAJE_ALTA_GENERICO,
  });
}
