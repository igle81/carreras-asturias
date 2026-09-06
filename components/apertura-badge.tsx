import {
  aperturaBadgeLabel,
  resolveAperturaBadge,
  type AperturaBadgeKind,
} from "@/lib/apertura-badge";
import type { Evento } from "@/lib/types";

function badgeClass(kind: Exclude<AperturaBadgeKind, null>, size: "card" | "hero") {
  const base =
    size === "hero"
      ? "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold tracking-wide"
      : "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide";

  if (kind === "recien_abierta") {
    return `${base} bg-fire uppercase text-white`;
  }
  if (kind === "abierta_hoy") {
    return `${base} bg-atlantic text-white`;
  }
  return `${base} bg-gold text-forest`;
}

export function AperturaBadge({
  event,
  size = "card",
}: {
  event: Evento;
  size?: "card" | "hero";
}) {
  const kind = resolveAperturaBadge(event);
  const label = aperturaBadgeLabel(kind);
  if (!kind || !label) return null;

  return <span className={badgeClass(kind, size)}>{label}</span>;
}
