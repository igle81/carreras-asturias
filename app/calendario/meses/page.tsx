import type { Metadata } from "next";
import Link from "next/link";
import { PaginaSeo } from "@/components/listado-seo";
import { getEventos } from "@/lib/events";
import {
  carrerasConFecha,
  esPaginaFina,
  eventosDelMes,
  mesesConPruebas,
  mesPath,
  mesTitulo,
  ROBOTS_NOINDEX_FOLLOW,
} from "@/lib/paginas-seo";
import { enlacesSeo } from "@/lib/paginas-seo-enlaces";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const META_MESES = pageMetadata({
  title: "Calendario de carreras en Asturias por meses",
  description: "Carreras populares, trail y ciclismo en Asturias mes a mes, con fechas, concejos e inscripciones.",
  path: "/calendario/meses",
});

export async function generateMetadata(): Promise<Metadata> {
  // Menos de 5 carreras: noindex,follow y fuera del sitemap (SEO 03-11-2026).
  const fina = esPaginaFina(carrerasConFecha(await getEventos()));
  return fina ? { ...META_MESES, robots: ROBOTS_NOINDEX_FOLLOW } : META_MESES;
}

export default async function MesesPage() {
  const events = await getEventos();
  const meses = mesesConPruebas(events);
  return (
    <PaginaSeo
      h1="Calendario de carreras por meses"
      intro={<p>Meses con pruebas en el calendario. Entre paréntesis, cuántas hay.</p>}
      relacionados={enlacesSeo(events).filter((l) => l.href !== "/calendario/meses")}
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {meses.map((m) => (
          <li key={mesPath(m)}>
            <Link href={mesPath(m)} className="font-medium capitalize underline-offset-2 hover:underline">
              {mesTitulo(m)}
            </Link>{" "}
            <span className="text-ink/70">({eventosDelMes(events, m.anio, m.mes).length})</span>
          </li>
        ))}
      </ul>
    </PaginaSeo>
  );
}
