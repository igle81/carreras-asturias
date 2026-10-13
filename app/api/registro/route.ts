import { NextResponse } from "next/server";
import { crearCuentaAlertas } from "@/lib/cuenta-alertas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const entrada = await request.json().catch(() => ({}));
  const resultado = await crearCuentaAlertas(entrada);
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, { status: resultado.status });
  }
  return NextResponse.json({
    ok: true,
    confirmarCorreo: resultado.confirmarCorreo,
    avisos: resultado.avisos,
  });
}
