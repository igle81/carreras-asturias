"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { visibleDisciplineFilters } from "@/lib/disciplines";
import type { ModalidadId } from "@/lib/modalidad";
import type { Evento } from "@/lib/types";

function chipClass(active: boolean) {
  return `shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
    active
      ? "bg-forest text-white"
      : "border border-forest/15 bg-white text-forest hover:border-atlantic/40"
  }`;
}

export function DisciplineLinkChips({
  events,
  calendarPath,
  modalidad,
}: {
  events: Evento[];
  calendarPath: string;
  modalidad: ModalidadId;
}) {
  const chips = visibleDisciplineFilters(events, modalidad);
  if (!chips.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {chips.map((item) => (
        <Link
          key={item.id}
          href={`${calendarPath}?disciplina=${item.id}`}
          className={chipClass(false)}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function DisciplineChips({
  events,
  modalidad,
}: {
  events: Evento[];
  modalidad: ModalidadId;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
