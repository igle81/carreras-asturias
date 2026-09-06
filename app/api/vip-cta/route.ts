import { NextResponse } from "next/server";
import { getVipCtaClickCount, recordVipCtaClick, sanitizeVipCtaPath } from "@/lib/vip-cta";

export const dynamic = "force-dynamic";

type PostBody = {
  path?: unknown;
};

export async function POST(request: Request) {
  let body: PostBody = {};
  try {
    body = (await request.json()) as PostBody;
  } catch {
    body = {};
  }

  const { recorded } = await recordVipCtaClick({
    path: sanitizeVipCtaPath(body.path),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true, recorded }, { status: recorded ? 200 : 202 });
}

export async function GET() {
  const count = await getVipCtaClickCount();
  return NextResponse.json({ count });
}
