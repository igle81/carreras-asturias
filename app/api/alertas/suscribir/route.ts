import { NextResponse } from "next/server";
import { confirmarSuscripcionAlertas } from "@/lib/suscripcion-alertas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const resultado = await confirmarSuscripcionAlertas(token);
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, { status: resultado.status });
  }
  return NextResponse.json({
    ok: true,
    nueva: resultado.nueva,
    avisos: resultado.avisos,
  });
}
