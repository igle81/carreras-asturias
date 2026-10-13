import { NextResponse } from "next/server";
import { registrarClicAfiliado } from "@/lib/afiliado";
import { ipDeLaPeticion, limiteClicAfiliado } from "@/lib/limite-ip";

export const dynamic = "force-dynamic";

type PostBody = {
  path?: unknown;
};

let tablaAusente = false;

export async function POST(request: Request) {
  if (tablaAusente) {
    return new NextResponse(null, { status: 204 });
  }
  if (!limiteClicAfiliado.contar(ipDeLaPeticion(request.headers)).permitido) {
    return NextResponse.json({ recorded: false, prepared: true }, { status: 429 });
  }

  let body: PostBody = {};
  try {
    body = (await request.json()) as PostBody;
  } catch {
    body = {};
  }

  const resultado = await registrarClicAfiliado({ path: body.path });
  if (resultado.absent) tablaAusente = true;
  return NextResponse.json(
    { ...resultado, disabled: tablaAusente },
    { status: resultado.recorded ? 200 : 202 },
  );
}
