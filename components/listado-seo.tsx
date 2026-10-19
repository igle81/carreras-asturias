import Link from "next/link";
import type { ReactNode } from "react";
import { EventCard } from "./event-card";
import { formatFechaHumana } from "@/lib/dates";
import type { Evento } from "@/lib/types";

export type EnlaceSeo = { href: string; label: string };

/** Marco común de las páginas SEO: H1, entradilla, listado y enlaces relacionados. */
export function PaginaSeo({
  h1,
  intro,
  children,
  relacionados,
}: {
  h1: string;
  intro: ReactNode;
  children: ReactNode;
  relacionados?: EnlaceSeo[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-black sm:text-4xl">{h1}</h1>
      <div className="mt-3 max-w-3xl text-base text-ink/70">{intro}</div>
      <div className="mt-8 space-y-10">{children}</div>
      {relacionados?.length ? (
        <nav aria-label="Páginas relacionadas" className="mt-12 border-t border-forest/10 pt-6">
          <h2 className="font-display text-lg font-bold">También te puede interesar</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            {relacionados.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-6 items-center underline-offset-2 hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

export function RejillaEventos({ eventos, titulo }: { eventos: Evento[]; titulo?: string }) {
  if (!eventos.length) return null;
  return (
    <section>
      {titulo ? <h2 className="mb-4 font-display text-xl font-bold capitalize">{titulo}</h2> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {eventos.map((e) => (
          <EventCard key={e.id_canonico} event={e} compact />
        ))}
      </div>
    </section>
  );
}

export function tituloDia(dia: string): string {
  return formatFechaHumana(dia);
}
