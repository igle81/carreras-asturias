import { PaginaSeo, RejillaEventos, tituloDia } from "@/components/listado-seo";
import { formatFechaHumana } from "@/lib/dates";
import { getEventos } from "@/lib/events";
import { agruparPorDia, pruebasFinDeSemana } from "@/lib/paginas-seo";
import { enlacesSeo } from "@/lib/paginas-seo-enlaces";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Carreras en Asturias este fin de semana",
  description:
    "Carreras populares, trail y ciclismo en Asturias este fin de semana: fecha, concejo, distancia e inscripción. Se actualiza cada día con el calendario.",
  path: "/este-fin-de-semana",
});

export default async function EsteFinDeSemanaPage() {
  const events = await getEventos();
  const { finde, eventos, siguiente } = pruebasFinDeSemana(events);
  const rango = `del ${formatFechaHumana(finde.viernes)} al ${formatFechaHumana(finde.domingo)}`;
  return (
    <PaginaSeo
      h1="Carreras en Asturias este fin de semana"
      intro={
        siguiente ? (
          <p>
            Este fin de semana no hay pruebas en el calendario. Estas son las del siguiente, {rango}
            {eventos.length ? "." : ": todavía no hay ninguna publicada."}
          </p>
        ) : (
          <p>
            {eventos.length} {eventos.length === 1 ? "prueba" : "pruebas"} {rango}, a pie y en bici, con su concejo,
            distancia y enlace de inscripción.
          </p>
        )
      }
      relacionados={enlacesSeo(events).filter((l) => l.href !== "/este-fin-de-semana")}
    >
      {agruparPorDia(eventos, finde.viernes).map(({ dia, eventos: delDia }) => (
        <RejillaEventos key={dia} titulo={tituloDia(dia)} eventos={delDia} />
      ))}
    </PaginaSeo>
  );
}
