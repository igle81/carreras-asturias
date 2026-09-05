"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DISCIPLINE_FILTERS } from "@/lib/disciplines";

function chipClass(active: boolean) {
  return `shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
    active
      ? "bg-forest text-white"
      : "border border-forest/15 bg-white text-forest hover:border-atlantic/40"
  }`;
}

export function DisciplineLinkChips() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {DISCIPLINE_FILTERS.map((item) => (
        <Link key={item.id} href={`/calendario?disciplina=${item.id}`} className={chipClass(false)}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function DisciplineChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("disciplina") ?? "";

  function toggle(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (current === id) params.delete("disciplina");
    else params.set("disciplina", id);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {DISCIPLINE_FILTERS.map((item) => (
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
