"use client";

import { useGeo } from "./geo-provider";

type ConcejoSelectProps = {
  concejos: string[];
  className?: string;
  id?: string;
};

export function ConcejoSelect({ concejos, className = "", id }: ConcejoSelectProps) {
  const { concejo, setConcejo, showConcejoFallback, status } = useGeo();

  if (!showConcejoFallback && status !== "idle") {
    return null;
  }

  if (!concejos.length) return null;

  return (
    <label className={`flex min-w-0 items-center gap-2 text-sm text-ink/80 ${className}`}>
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-ink/50">
        Concejo
      </span>
      <select
        id={id}
        value={concejo}
        onChange={(event) => setConcejo(event.target.value)}
        className="w-full min-w-0 rounded-full border border-forest/15 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none ring-atlantic/30 focus:ring-2"
      >
        <option value="">Todos los concejos</option>
        {concejos.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
