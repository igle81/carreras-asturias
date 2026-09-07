export const LEGAL_DRAFT_NOTE = "Borrador";

export const LEGAL_PLACEHOLDERS = {
  titular: "[NOMBRE/RAZÓN SOCIAL]",
  nif: "[completar]",
  domicilio: "[completar]",
  email: "iaaviles2026@gmail.com",
} as const;

export const COOKIE_CONSENT_KEY = "ca-cookie-consent";
export const COOKIE_CONSENT_VERSION = 1 as const;

export type CookieConsentDecision = {
  version: typeof COOKIE_CONSENT_VERSION;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

export const LEGAL_NAV = [
  { href: "/privacidad", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/terminos", label: "Términos" },
] as const;

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  slug: "privacidad" | "cookies" | "aviso-legal" | "terminos";
  title: string;
  description: string;
  updatedLabel: string;
  sections: LegalSection[];
};

const { titular, nif, domicilio, email } = LEGAL_PLACEHOLDERS;

export const LEGAL_DOCUMENTS: Record<LegalDocument["slug"], LegalDocument> = {
  privacidad: {
    slug: "privacidad",
    title: "Política de privacidad",
    description:
      "Cómo trata Carreras Asturias los datos personales: responsable, finalidades, encargados y derechos ARCO+.",
    updatedLabel: "Borrador · pendiente de datos identificativos",
    sections: [
      {
        heading: "1. Responsable del tratamiento",
        paragraphs: [
          `El responsable del tratamiento es ${titular}, NIF ${nif}, con domicilio en ${domicilio} y correo de contacto ${email}.`,
          "Datos identificativos completos pendientes (razón social, NIF y domicilio por completar).",
        ],
      },
      {
        heading: "2. Datos que se tratan",
        paragraphs: [
          "En la versión actual del portal no hay registro de cuenta ni formularios de alta de usuario.",
        ],
        bullets: [
          "Logs técnicos de seguridad y funcionamiento (dirección IP, user-agent, ruta y marca temporal) generados por el hosting.",
          "Geolocalización del navegador solo si el usuario la activa con el botón de cercanía. Las coordenadas se usan en el dispositivo para calcular distancias y no se envían a un perfil persistente.",
          "Alertas futuras (push, email u otros canales) solo se activarán con un consentimiento específico, que hoy no se solicita.",
        ],
      },
      {
        heading: "3. Finalidades y bases jurídicas",
        paragraphs: ["Tratamos datos solo para las finalidades siguientes:"],
        bullets: [
          "Mostrar el calendario de carreras y ciclismo en Asturias (interés legítimo en informar sobre eventos públicos).",
          "Garantizar la seguridad y el correcto funcionamiento del sitio (interés legítimo).",
          "Calcular carreras cercanas cuando el usuario activa la geolocalización (consentimiento).",
          "Cookies o almacenamientos no esenciales, solo con consentimiento (ver política de cookies).",
        ],
      },
      {
        heading: "4. Destinatarios y encargados",
        paragraphs: [
          "No vendemos datos personales. Los tratamientos técnicos se apoyan en encargados que prestan infraestructura:",
        ],
        bullets: [
          "Hosting y entrega del sitio: Vercel.",
          "Base de datos de eventos: Supabase.",
        ],
      },
      {
        heading: "5. Conservación",
        paragraphs: [
          "Los logs técnicos se conservan el tiempo necesario para seguridad y diagnóstico. La preferencia de cookies se guarda en el navegador (localStorage) hasta que el usuario la borre o la cambie. La geolocalización no se almacena como histórico de posición.",
        ],
      },
      {
        heading: "6. Derechos y reclamaciones",
        paragraphs: [
          `Puedes ejercer los derechos de acceso, rectificación, cancelación/supresión, oposición, limitación y portabilidad (ARCO+) escribiendo a ${email}. También puedes reclamar ante la Agencia Española de Protección de Datos (AEPD) si consideras que el tratamiento no se ajusta a la normativa.`,
        ],
      },
      {
        heading: "7. Menores",
        paragraphs: [
          "Este portal no está dirigido a menores de 14 años. Si detectamos datos de un menor por debajo de esa edad, los eliminaremos cuando sea posible identificarlos.",
        ],
      },
    ],
  },
  cookies: {
    slug: "cookies",
    title: "Política de cookies",
    description:
      "Cookies y almacenamientos de Carreras Asturias: técnicas, preferencias y analítica no activa por defecto.",
    updatedLabel: "Borrador · sin analítica activa",
    sections: [
      {
        heading: "1. Qué usamos hoy",
        paragraphs: [
          "Carreras Asturias usa almacenamientos del navegador de forma mínima. No hay cookies de analítica ni de marketing activas por defecto. El banner de consentimiento deja el hueco para activarlas en el futuro, sin cargar scripts de terceros mientras no exista un consentimiento afirmativo.",
        ],
      },
      {
        heading: "2. Categorías",
        paragraphs: ["Clasificamos las cookies y almacenamientos así:"],
        bullets: [
          "Necesarias / técnicas: imprescindibles para mostrar el sitio, recordar la decisión del banner (`ca-cookie-consent` en localStorage) y el funcionamiento básico.",
          "Preferencias: concejo o modalidad si se persisten en el navegador para no preguntar en cada visita.",
          "Analítica: no activas hoy. Si se incorporan, solo se cargarán con consentimiento.",
          "Marketing: no activas hoy. Si se incorporan, solo se cargarán con consentimiento.",
        ],
      },
      {
        heading: "3. Geolocalización",
        paragraphs: [
          "La geolocalización no es una cookie. El navegador solo comparte coordenadas cuando pulsas el botón de encontrar carreras cerca. Ese permiso se gestiona en el propio navegador y se puede revocar en su configuración de privacidad.",
        ],
      },
      {
        heading: "4. Cómo gestionar el consentimiento",
        paragraphs: [
          "En la primera visita aparece un banner con «Aceptar» (incluye no esenciales futuras) y «Rechazar no esenciales». La elección se guarda en localStorage bajo la clave `ca-cookie-consent`. Puedes borrar los datos del sitio en el navegador para volver a ver el banner. También puedes bloquear o eliminar cookies desde la configuración del navegador.",
        ],
      },
    ],
  },
  "aviso-legal": {
    slug: "aviso-legal",
    title: "Aviso legal",
    description:
      "Titularidad, carácter informativo y limitación de responsabilidad del portal Carreras Asturias.",
    updatedLabel: "Borrador · titular pendiente",
    sections: [
      {
        heading: "1. Titular del portal",
        paragraphs: [
          `Titular del portal: contacto ${email}. Datos identificativos completos pendientes (NIF ${nif}, domicilio ${domicilio}).`,
        ],
      },
      {
        heading: "2. Objeto",
        paragraphs: [
          "Este sitio es un portal informativo que agrupa un calendario de carreras a pie y pruebas de ciclismo en Asturias. Los datos de eventos proceden de fuentes públicas y de organizadores. Deben verificarse siempre en la web oficial de cada prueba (fechas, distancias, precios, cupos y reglamento).",
        ],
      },
      {
        heading: "3. Propiedad intelectual",
        paragraphs: [
          "La marca, el diseño y los textos propios del portal pertenecen a su titular. Los nombres, logotipos, carteles y contenidos de las pruebas pertenecen a sus respectivos organizadores o titulares. Su aparición aquí no implica cesión de derechos ni patrocinio.",
        ],
      },
      {
        heading: "4. Limitación de responsabilidad",
        paragraphs: [
          "No garantizamos la exhaustividad ni la actualización permanente del calendario. Errores, cancelaciones o cambios de última hora son responsabilidad del organizador. El uso de la información del portal es bajo la responsabilidad del usuario.",
        ],
      },
      {
        heading: "5. Legislación aplicable",
        paragraphs: [
          "Este aviso se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a derecho, sin perjuicio de los fueros que resulten imperativos para consumidores.",
        ],
      },
    ],
  },
  terminos: {
    slug: "terminos",
    title: "Términos de uso",
    description:
      "Condiciones de uso del calendario Carreras Asturias: uso personal, atribución y límites de scraping.",
    updatedLabel: "Borrador · contacto pendiente",
    sections: [
      {
        heading: "1. Aceptación",
        paragraphs: [
          "Al usar Carreras Asturias aceptas estos términos. Si no estás de acuerdo, no utilices el portal.",
        ],
      },
      {
        heading: "2. Uso del calendario",
        paragraphs: [
          "El calendario se ofrece para uso personal e informativo: consultar pruebas, filtrar por concejo o modalidad y decidir si inscribirte en la web del organizador.",
        ],
      },
      {
        heading: "3. Usos no permitidos",
        paragraphs: [
          "Queda prohibido el scraping abusivo, la sobrecarga deliberada del servicio, la reutilización masiva del calendario como producto propio sin autorización, y cualquier uso que vulnere derechos de terceros o la ley.",
        ],
      },
      {
        heading: "4. Enlaces y atribución",
        paragraphs: [
          "Puedes enlazar al portal citando la fuente (Carreras Asturias) y sin enmarcar el sitio de forma que induzca a error sobre la titularidad.",
        ],
      },
      {
        heading: "5. Contacto",
        paragraphs: [
          `Para dudas sobre estos términos o para solicitar autorización de reutilización, escribe a ${email}.`,
        ],
      },
    ],
  },
};

export function isCookieConsentDecision(value: unknown): value is CookieConsentDecision {
  if (!value || typeof value !== "object") return false;
  const candidate = value as CookieConsentDecision;
  return (
    candidate.version === COOKIE_CONSENT_VERSION &&
    candidate.necessary === true &&
    typeof candidate.analytics === "boolean" &&
    typeof candidate.marketing === "boolean" &&
    typeof candidate.decidedAt === "string"
  );
}

/** Lee una decisión ya persistida. No carga scripts; solo describe el hueco futuro. */
export function parseCookieConsent(raw: string | null): CookieConsentDecision | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isCookieConsentDecision(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function buildCookieConsent(allowNonEssential: boolean): CookieConsentDecision {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: allowNonEssential,
    marketing: allowNonEssential,
    decidedAt: new Date().toISOString(),
  };
}
