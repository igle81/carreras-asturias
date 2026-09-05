"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { visibleDisciplineFilters } from "@/lib/disciplines";
import { parseModalidadFilter } from "@/lib/modalidad";
import type { Evento } from "@/lib/types";

function chipClass(active: boolean) {
  return `shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
    active
      ? "bg-forest text-white"
      : "border border-forest/15 bg-white text-forest hover:border-atlantic/40"
  }`;
}

export function DisciplineLinkChips({ events }: { events: Evento[] }) {
  const searchParams = useSearchParams();
  const modalidad = parseModalidadFilter(searchParams.get("modalidad"));
  const chips = visibleDisciplineFilters(events, modalidad);

  if (!chips.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {chips.map((item) => {
        const params = new URLSearchParams();
        if (modalidad !== "todas") params.set("modalidad", modalidad);
        params.set("disciplina", item.id);
        return (
          <Link key={item.id} href={`/calendario?${params.toString()}`} className={chipClass(false)}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function DisciplineChips({ events }: { events: Evento[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modalidad = parseModalidadFilter(searchParams.get("modalidad"));
  const current = searchParams.get("disciplina") ?? "";
  const chips = visibleDisciplineFilters(events, modalidad);

  if (!chips.length) return null;

  function toggle(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (current === id) params.delete("disciplina");
    else params.set("disciplina", id);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {chips.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => toggle(item.id)}
          className={chipClass(current === item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
