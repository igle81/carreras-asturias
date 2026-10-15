import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaSeo, RejillaEventos } from "@/components/listado-seo";
import { getEventos } from "@/lib/events";
import { anioActual, concejoPath, concejosDe, proximasYPasadas } from "@/lib/paginas-seo";
import { enlacesSeo } from "@/lib/paginas-seo-enlaces";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [...concejosDe(await getEventos()).keys()].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = concejosDe(await getEventos()).get(slug);
  if (!c) notFound();
  const anio = anioActual();
  return pageMetadata({
    title: `Carreras en ${c.nombre} ${anio}: populares, trail y ciclismo`,
    description: `Próximas carreras en ${c.nombre} (Asturias): carreras populares, trail y ciclismo con fecha e inscripción. Calendario actualizado a diario.`,
    path: concejoPath(slug),
  });
}

export default async function ConcejoPage({ params }: Props) {
  const { slug } = await params;
  const events = await getEventos();
  const c = concejosDe(events).get(slug);
  if (!c) notFound();
  const { proximas, pasadas } = proximasYPasadas(c.eventos);
  return (
    <PaginaSeo
      h1={`Carreras en ${c.nombre}`}
      intro={
        <p>
          {proximas.length
            ? `${proximas.length} ${proximas.length === 1 ? "prueba por celebrar" : "pruebas por celebrar"} en ${c.nombre}.`
            : `Ahora no hay pruebas por celebrar en ${c.nombre}.`}{" "}
          {pasadas.length ? `Más abajo, las ${pasadas.length} ya celebradas.` : ""}
        </p>
      }
      relacionados={enlacesSeo(events)}
    >
      <RejillaEventos titulo="Próximas" eventos={proximas} />
      <RejillaEventos titulo="Ya celebradas" eventos={pasadas} />
    </PaginaSeo>
  );
}
