import { buildSitemapXml, staticSitemapXml } from "@/lib/sitemap-xml";

export const revalidate = 3600;

function xmlResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET(): Promise<Response> {
  try {
    return xmlResponse(await buildSitemapXml());
  } catch (error) {
    console.error("sitemap: GET falló; se sirven rutas estáticas", error);
    return xmlResponse(staticSitemapXml());
  }
}
