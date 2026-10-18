import Link from "next/link";
import { PaginaSeo } from "@/components/listado-seo";
import { getEventos } from "@/lib/events";
import { concejoPath, concejosDe, proximasYPasadas } from "@/lib/paginas-seo";
import { enlacesSeo } from "@/lib/paginas-seo-enlaces";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Carreras por concejo en Asturias",
  description: "Carreras populares, trail y ciclismo de cada concejo de Asturias con pruebas en el calendario.",
  path: "/concejo",
});

export default async function ConcejosPage() {
  const events = await getEventos();
  const lista = [...concejosDe(events).entries()].sort(([, a], [, b]) => a.nombre.localeCompare(b.nombre, "es"));
  return (
    <PaginaSeo
      h1="Carreras por concejo"
      intro={<p>Concejos de Asturias con pruebas en el calendario. Entre paréntesis, las que quedan por celebrar.</p>}
      relacionados={enlacesSeo(events).filter((l) => l.href !== "/concejo")}
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map(([slug, c]) => (
          <li key={slug}>
            <Link href={concejoPath(slug)} className="font-medium underline-offset-2 hover:underline">
              Carreras en {c.nombre}
            </Link>{" "}
            <span className="text-ink/70">({proximasYPasadas(c.eventos).proximas.length})</span>
          </li>
        ))}
      </ul>
    </PaginaSeo>
  );
}
