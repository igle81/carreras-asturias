import Link from "next/link";
import { MapaBanderillas } from "@/components/mapa-banderillas";
import { aplicarPrecision, fetchCoordsPrecision, getEventos } from "@/lib/events";
import {
  categoriasBanderillas,
  hayUbicacionDeMunicipio,
  leyendaDe,
  puntosDesdeEventos,
} from "@/lib/mapa-carreras";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Mapa de carreras",
  description:
    "Mapa de carreras a pie y ciclismo en Asturias. Cada banderilla es una prueba, con fecha, tipo y enlace a su ficha.",
  path: "/mapa",
  keywords: ["mapa carreras Asturias", "carreras por concejo", "trail Asturias", "ciclismo Asturias"],
});

export default async function MapaPage() {
  const [events, precision] = await Promise.all([getEventos(), fetchCoordsPrecision()]);
  const conPrecision = aplicarPrecision(events, precision);
  const puntos = puntosDesdeEventos(conPrecision);
  const aproximada = hayUbicacionDeMunicipio(conPrecision);
  const leyenda = leyendaDe(puntos);
  const cuantas = puntos.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-atlantic">Mapa</p>
      <h1 className="font-display text-3xl font-black text-ink">Dónde están las carreras</h1>
      <p className="mt-2 max-w-2xl text-ink/70">
        Cada banderilla es una prueba. Si varias coinciden en el mismo sitio, comparten chincheta y el
        número indica cuántas hay. Al pulsarla ves el nombre, el tipo de carrera, la fecha y el enlace a
        la ficha.
      </p>
      {aproximada ? (
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          La ubicación es aproximada cuando solo consta el municipio: la banderilla marca el centro del
          concejo, no la línea de salida.
        </p>
      ) : null}

      <p className="mt-4 text-sm text-ink/55">
        {cuantas === 1 ? "1 carrera en el mapa." : `${cuantas} carreras en el mapa.`}
      </p>

      {leyenda.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {leyenda.map((item) => (
            <li
              key={item.clave}
              className="inline-flex items-center gap-1.5 rounded-full border border-forest/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink/80"
            >
              <span
                aria-hidden
                className="grid h-5 w-5 place-items-center rounded-full text-[11px] text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.icono}
              </span>
              {item.nombre}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5">
        {cuantas ? (
          <MapaBanderillas
            puntos={puntos}
            categorias={categoriasBanderillas()}
            estiloPorDefecto={{ nombre: "Carrera", color: "#14532d", icono: "📍" }}
            comoLlegar
            alto="min(70vh, 36rem)"
            textos={{
              enlace: "Ver ficha",
              etiquetaMapa:
                "Mapa de carreras en Asturias. Cada banderilla es un lugar con una o varias pruebas.",
            }}
          />
        ) : (
          <p className="rounded-3xl border border-dashed border-forest/20 bg-white px-4 py-16 text-center text-ink/60">
            Ahora mismo no hay carreras con fecha y ubicación para pintar en el mapa.
          </p>
        )}
      </div>

      <p className="mt-3 text-xs text-ink/50">
        Mapa base ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          className="underline decoration-forest/30 underline-offset-2 hover:text-forest"
          target="_blank"
          rel="noreferrer"
        >
          colaboradores de OpenStreetMap
        </a>
        . Datos del callejero bajo la licencia ODbL.
      </p>

      <p className="mt-6 text-sm">
        <Link href="/correr#mapa" className="font-semibold text-atlantic hover:text-forest">
          Carreras a pie
        </Link>
        <span className="text-ink/40"> · </span>
        <Link href="/ciclismo#mapa" className="font-semibold text-atlantic hover:text-forest">
          Ciclismo
        </Link>
      </p>
    </div>
  );
}
