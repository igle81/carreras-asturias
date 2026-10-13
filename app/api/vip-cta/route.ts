import { NextResponse } from "next/server";
import { ipDeLaPeticion, limiteClicVip } from "@/lib/limite-ip";
import { getVipCtaClickCount, recordVipCtaClick, rutaVipValida } from "@/lib/vip-cta";

export const dynamic = "force-dynamic";

type PostBody = {
  path?: unknown;
};

export async function POST(request: Request) {
  if (!limiteClicVip.contar(ipDeLaPeticion(request.headers)).permitido) {
    return NextResponse.json(
      { ok: false, recorded: false, error: "Demasiados intentos. Espera un poco y vuelve a probar." },
      { status: 429 },
    );
  }

  let body: PostBody = {};
  try {
    body = (await request.json()) as PostBody;
  } catch {
    body = {};
  }

  const path = rutaVipValida(body.path);
  if (!path) {
    return NextResponse.json({ ok: false, recorded: false }, { status: 400 });
  }

  const { recorded } = await recordVipCtaClick({
    path,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true, recorded }, { status: recorded ? 200 : 202 });
}

export async function GET() {
  const count = await getVipCtaClickCount();
  return NextResponse.json({ count });
}
