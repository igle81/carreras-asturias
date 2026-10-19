import { NextResponse } from "next/server";
import { externalIdAdminParaSesion } from "@/lib/onesignal-admin";

export const dynamic = "force-dynamic";

const SIN_CACHE = { "cache-control": "no-store", "x-robots-tag": "noindex" };

/** Devuelve el external_id de OneSignal del administrador solo a su propia sesión. */
export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const resultado = await externalIdAdminParaSesion(token);
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, { status: resultado.status, headers: SIN_CACHE });
  }
  return NextResponse.json({ ok: true, externalId: resultado.externalId }, { headers: SIN_CACHE });
}
