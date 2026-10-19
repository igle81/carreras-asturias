import { PaginaSeo, RejillaEventos } from "@/components/listado-seo";
import { getEventos } from "@/lib/events";
import { anioActual, proximasYPasadas, pruebasTrail } from "@/lib/paginas-seo";
import { enlacesSeo } from "@/lib/paginas-seo-enlaces";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export function generateMetadata() {
  const anio = anioActual();
  return pageMetadata({
    title: `Trail en Asturias ${anio}: calendario de carreras de montaña`,
    description: `Todas las carreras de trail y montaña en Asturias en ${anio}: fechas, concejo y distancia. Inscripciones al día.`,
    path: "/trail",
  });
}

export default async function TrailPage() {
  const events = await getEventos();
  const anio = anioActual();
  const { proximas, pasadas } = proximasYPasadas(pruebasTrail(events, anio));
  return (
    <PaginaSeo
      h1={`Calendario de trail en Asturias ${anio}`}
      intro={
        <p>
          {proximas.length} {proximas.length === 1 ? "prueba" : "pruebas"} de trail y montaña por celebrar y{" "}
          {pasadas.length} ya celebradas en {anio}. Cada una enlaza a su ficha con la inscripción.
        </p>
      }
      relacionados={enlacesSeo(events).filter((l) => l.href !== "/trail")}
    >
      <RejillaEventos titulo="Próximas" eventos={proximas} />
      <RejillaEventos titulo={`Ya celebradas en ${anio}`} eventos={pasadas} />
    </PaginaSeo>
  );
}
