import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaSeo, RejillaEventos, tituloDia } from "@/components/listado-seo";
import { getEventos } from "@/lib/events";
import { agruparPorDia, eventosDelMes, mesesConPruebas, mesPath, mesTitulo } from "@/lib/paginas-seo";
import { enlacesSeo } from "@/lib/paginas-seo-enlaces";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ anio: string; mes: string }> };

export async function generateStaticParams() {
  return mesesConPruebas(await getEventos());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { anio, mes } = await params;
  if (!eventosDelMes(await getEventos(), anio, mes).length) notFound();
  const t = mesTitulo({ anio, mes });
  return pageMetadata({
    title: `Carreras en Asturias en ${t}: calendario`,
    description: `Calendario de carreras populares, trail y ciclismo en Asturias en ${t}, con fechas, concejos e inscripciones.`,
    path: mesPath({ anio, mes }),
  });
}

export default async function MesPage({ params }: Props) {
  const { anio, mes } = await params;
  const events = await getEventos();
  const delMes = eventosDelMes(events, anio, mes);
  if (!delMes.length) notFound();
  const meses = mesesConPruebas(events);
  const i = meses.findIndex((m) => m.anio === anio && m.mes === mes);
  const anterior = i > 0 ? meses[i - 1] : null;
  const siguiente = i >= 0 && i < meses.length - 1 ? meses[i + 1] : null;
  return (
    <PaginaSeo
      h1={`Carreras en Asturias en ${mesTitulo({ anio, mes })}`}
      intro={
        <>
          <p>
            {delMes.length} {delMes.length === 1 ? "prueba" : "pruebas"} a pie y en bici en el calendario de {mes}, por fecha.
          </p>
          <p className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
            {anterior ? <Link href={mesPath(anterior)} className="underline-offset-2 hover:underline">← {mesTitulo(anterior)}</Link> : null}
            {siguiente ? <Link href={mesPath(siguiente)} className="underline-offset-2 hover:underline">{mesTitulo(siguiente)} →</Link> : null}
          </p>
        </>
      }
      relacionados={enlacesSeo(events)}
    >
      {agruparPorDia(delMes).map(({ dia, eventos }) => (
        <RejillaEventos key={dia} titulo={tituloDia(dia)} eventos={eventos} />
      ))}
    </PaginaSeo>
  );
}
