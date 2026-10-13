import { NextResponse } from "next/server";
import { registrarClicAfiliado } from "@/lib/afiliado";

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

  const resultado = await registrarClicAfiliado({ path: body.path });
  return NextResponse.json(resultado, { status: resultado.recorded ? 200 : 202 });
}
