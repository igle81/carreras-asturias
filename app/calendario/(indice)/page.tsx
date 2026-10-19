import { redirect } from "next/navigation";
import { SECTIONS } from "@/lib/sections";

type CalendarioRedirectProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CalendarioRedirect({ searchParams }: CalendarioRedirectProps) {
  const params = await searchParams;
  const modalidad = typeof params.modalidad === "string" ? params.modalidad : "";
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "modalidad" || value == null) continue;
    const text = Array.isArray(value) ? value[0] : value;
    if (text) next.set(key, text);
  }
  const query = next.toString();
  const base = modalidad === "ciclismo" ? SECTIONS.ciclismo.calendar : SECTIONS.pie.calendar;
  redirect(query ? `${base}?${query}` : base);
}
