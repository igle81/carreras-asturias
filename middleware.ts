import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { HSTS } from "@/lib/cabeceras";

/**
 * El ápice redirige hoy en el borde de Vercel, antes de llegar aquí, y esa
 * respuesta no lleva las cabeceras de next.config. Si la petición entra en
 * la app, el 308 a www sale con HSTS includeSubDomains.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (host !== "carrerasasturias.es") return NextResponse.next();

  const destino = request.nextUrl.clone();
  destino.protocol = "https:";
  destino.hostname = "www.carrerasasturias.es";
  destino.port = "";
  const response = NextResponse.redirect(destino, 308);
  response.headers.set("Strict-Transport-Security", HSTS);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
