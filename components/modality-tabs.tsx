"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MODALIDAD_TABS, parseModalidadFilter, type ModalidadFilter } from "@/lib/modalidad";

function tabClass(active: boolean) {
  return `shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
    active
      ? "bg-forest text-white"
      : "border border-forest/15 bg-white text-forest hover:border-atlantic/40"
  }`;
}

type ModalityTabsProps = {
  selected?: ModalidadFilter;
  basePath?: string;
};

export function ModalityTabs({ selected, basePath }: ModalityTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = selected ?? parseModalidadFilter(searchParams.get("modalidad"));
  const path = basePath ?? pathname;

  function hrefFor(id: ModalidadFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "todas") params.delete("modalidad");
    else params.set("modalidad", id);
    if (id !== current) params.delete("disciplina");
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Modalidad">
      {MODALIDAD_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={hrefFor(tab.id)}
          role="tab"
          aria-selected={current === tab.id}
          className={tabClass(current === tab.id)}
          scroll={false}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
