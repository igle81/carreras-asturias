import Link from "next/link";
import type { Section } from "@/lib/sections";

export function HomeBanner({ count, section }: { count: number; section: Section }) {
  const headline =
    count === 0
      ? section.bannerZero
      : count === 1
        ? section.bannerOne
        : section.bannerMany.replace("{n}", String(count));

  return (
    <section className="border-y border-gold/30 bg-gold/15">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg font-bold text-forest">{headline}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`${section.calendar}?recien=1`}
            className="rounded-full bg-fire px-4 py-2 text-sm font-bold text-white"
          >
            Ver recién abiertas
          </Link>
          <Link
            href={`${section.calendar}?ventana=14`}
            className="rounded-full border border-forest/20 bg-white px-4 py-2 text-sm font-semibold text-forest"
          >
            Próximos 14 días
          </Link>
        </div>
      </div>
    </section>
  );
}
