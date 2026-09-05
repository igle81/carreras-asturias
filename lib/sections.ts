import type { ModalidadId } from "./modalidad";

export type Section = {
  id: ModalidadId;
  home: string;
  calendar: string;
  nav: string;
  title: string;
  eyebrow: string;
  blurb: string;
  calendarTitle: string;
  calendarLead: string;
  bannerZero: string;
  bannerOne: string;
  bannerMany: string;
  heroKicker: string;
  mapTitle: string;
  other: ModalidadId;
};

export const SECTIONS: Record<ModalidadId, Section> = {
  pie: {
    id: "pie",
    home: "/correr",
    calendar: "/correr/calendario",
    nav: "Correr",
    title: "Carreras a pie",
    eyebrow: "Correr en Asturias",
    blurb: "Trail, asfalto, cross y dorsales. Solo carreras a pie.",
    calendarTitle: "Calendario a pie",
    calendarLead: "Inscripciones, concejo y disciplina. Solo pruebas a pie.",
    bannerZero: "Hoy no hay inscripciones recién abiertas a pie. El calendario sigue vivo.",
    bannerOne: "Hay 1 inscripción recién abierta a pie. Si la quieres, el dorsal no espera.",
    bannerMany: "Hay {n} inscripciones recién abiertas a pie. Ponte las zapatillas antes de que vuelen.",
    heroKicker: "Carreras a pie en Asturias",
    mapTitle: "Carreras a pie por el Principado",
    other: "ciclismo",
  },
  ciclismo: {
    id: "ciclismo",
    home: "/ciclismo",
    calendar: "/ciclismo/calendario",
    nav: "Ciclismo",
    title: "Ciclismo",
    eyebrow: "Bici en Asturias",
    blurb: "Carretera, BTT, enduro y cicloturismo. Solo pruebas de ciclismo.",
    calendarTitle: "Calendario de ciclismo",
    calendarLead: "Inscripciones, concejo y disciplina. Solo pruebas de bici.",
    bannerZero: "Hoy no hay inscripciones recién abiertas de bici. El calendario sigue rodando.",
    bannerOne: "Hay 1 inscripción recién abierta de ciclismo. Si la quieres, el dorsal no espera.",
    bannerMany: "Hay {n} inscripciones recién abiertas de ciclismo. Sube a la bici antes de que vuelen.",
    heroKicker: "Ciclismo en Asturias",
    mapTitle: "Pruebas de ciclismo por el Principado",
    other: "pie",
  },
};

export function sectionFromPath(pathname: string): Section | null {
  if (pathname === "/ciclismo" || pathname.startsWith("/ciclismo/")) return SECTIONS.ciclismo;
  if (pathname === "/correr" || pathname.startsWith("/correr/")) return SECTIONS.pie;
  return null;
}

export function calendarPath(modalidad: ModalidadId): string {
  return SECTIONS[modalidad].calendar;
}
