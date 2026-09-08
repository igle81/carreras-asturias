/** Nota suave cuando falta NIF/domicilio. No usar un banner de «Borrador» en privacidad. */
export const LEGAL_IDENTITY_PENDING_NOTE =
  "Identidad del titular pendiente (NIF/domicilio)";

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
  /** Pill above the title. Null hides the global «Borrador» banner. */
  badge: string | null;
  sections: LegalSection[];
};

const { nif, domicilio, email } = LEGAL_PLACEHOLDERS;

export const LEGAL_DOCUMENTS: Record<LegalDocument["slug"], LegalDocument> = {
  privacidad: {
    slug: "privacidad",
    title: "Política de privacidad",
    description:
      "Cómo trata Carreras Asturias los datos personales: responsable, canal VIP, encargados, transferencias, automatización y derechos ARCO+.",
    updatedLabel: "Actualizado 8 de septiembre de 2026 · NIF y domicilio pendientes",
    badge: LEGAL_IDENTITY_PENDING_NOTE,
    sections: [
      {
        heading: "1. Responsable del tratamiento",
        paragraphs: [
          `Contacto del responsable del tratamiento: ${email}. NIF ${nif}, domicilio ${domicilio}.`,
          "Los datos identificativos del titular (NIF y domicilio) están pendientes de completar. Hasta entonces, el correo anterior es el canal de contacto del responsable.",
        ],
      },
      {
        heading: "2. Datos que se tratan",
        paragraphs: [
          "En la versión pública del portal no hay registro de cuenta ni formularios de alta de usuario. Podemos tratar las categorías siguientes, según cómo uses el sitio y si te suscribes al canal VIP:",
        ],
        bullets: [
          "Registros técnicos de seguridad y funcionamiento (dirección IP, user-agent, ruta y marca temporal) generados por el hosting.",
          "Geolocalización del navegador solo si la activas con el botón de cercanía. Las coordenadas se usan en el dispositivo para calcular distancias y no se guardan como un perfil persistente de ubicación.",
          "Preferencia de cookies en el navegador (localStorage, clave `ca-cookie-consent`).",
          "Si pulsas el botón de interés VIP, la ruta de la página y el user-agent para contar clics, sin crear una cuenta.",
          "Canal VIP (cuando hay suscripción o prueba): correo electrónico, datos de facturación y de cliente en Stripe, identificador de Telegram para el canal VIP privado, y datos de dispositivo/suscripción de notificaciones push en OneSignal.",
        ],
      },
      {
        heading: "3. Canal VIP (correo, pago, Telegram y push)",
        paragraphs: [
          "El canal VIP está pensado para avisos de inscripciones (víspera y mismo día) por correo, canal privado de Telegram y notificación push. El botón de alta puede aparecer como «Próximamente» en producción; en preproducción el checkout puede estar activo en modo de prueba. Esta política describe el tratamiento aplicable cuando te suscribes o pruebas esos canales, aunque el alta pública aún no esté abierta.",
          "Carreras Asturias no almacena el número completo de la tarjeta (PAN) ni el CVV. El pago de la suscripción se procesa en Stripe. No hay un enlace público permanente de Telegram (`t.me`); el acceso al canal VIP privado se gestiona tras la suscripción.",
        ],
        bullets: [
          "Correo electrónico: avisos VIP y comunicaciones relacionadas con la suscripción.",
          "Stripe: cobro de la cuota, cliente de facturación y, si estás suscrito, baja o gestión a través del Customer Portal de Stripe.",
          "Telegram: envío de avisos al canal VIP privado.",
          "OneSignal: notificaciones push en el navegador o dispositivo, solo si das permiso de notificaciones.",
        ],
      },
      {
        heading: "4. Finalidades y bases jurídicas",
        paragraphs: ["Tratamos datos solo para las finalidades siguientes:"],
        bullets: [
          "Mostrar el calendario de carreras y ciclismo en Asturias (interés legítimo en informar sobre eventos públicos).",
          "Garantizar la seguridad y el correcto funcionamiento del sitio (interés legítimo).",
          "Calcular carreras cercanas cuando activas la geolocalización (consentimiento).",
          "Cookies o almacenamientos no esenciales, solo con consentimiento (ver política de cookies).",
          "Medir el interés en el canal VIP a partir de clics en el botón (interés legítimo).",
          "Gestionar la suscripción VIP, el cobro y los avisos contratados (ejecución del contrato cuando te suscribes; consentimiento para el permiso de notificaciones push del navegador).",
          "Atender consultas y el ejercicio de derechos a través del buzón de contacto (interés legítimo y, cuando aplique, obligación legal).",
          "Difundir información pública de eventos en X (interés legítimo en comunicar el calendario).",
        ],
      },
      {
        heading: "5. Destinatarios y encargados",
        paragraphs: [
          "No vendemos datos personales. Los tratamientos se apoyan en proveedores que actúan como encargados o como responsables independientes según el servicio:",
        ],
        bullets: [
          "Vercel: alojamiento y entrega del sitio.",
          "Supabase: base de datos de eventos y registro de clics del CTA VIP.",
          "Stripe: pagos de la suscripción VIP. No almacenamos el PAN.",
          "OneSignal: notificaciones push del canal VIP.",
          "Telegram: canal VIP privado de avisos.",
          "GitHub: alojamiento del código y de la integración continua. No es una base de datos de usuarios del calendario.",
          `Gmail (Google): buzón de contacto ${email} para consultas y derechos.`,
          "X: publicación de contenidos informativos públicos sobre eventos. No se publica el correo de los suscriptores VIP.",
          "Meta (Facebook e Instagram): actualmente desactivado y no se usa para publicar.",
        ],
      },
      {
        heading: "6. Transferencias internacionales",
        paragraphs: [
          "Algunos de los proveedores anteriores pueden tratar datos desde Estados Unidos u otros países fuera del Espacio Económico Europeo. En esos casos nos apoyamos en las garantías que ofrezca cada proveedor, en particular la certificación en el Marco de Privacidad de Datos UE-EE. UU. (Data Privacy Framework) y/o las cláusulas contractuales tipo de la Comisión Europea, según consten en la documentación de privacidad de cada proveedor.",
        ],
      },
      {
        heading: "7. Automatización, inteligencia artificial y decisiones",
        paragraphs: [
          "Utilizamos automatización y agentes de inteligencia artificial para descubrir eventos públicos y para redactar o actualizar textos informativos del calendario. Ese uso no equivale a una decisión automatizada con efectos jurídicos o de impacto similar sobre ti.",
          "No adoptamos decisiones basadas únicamente en un tratamiento automatizado que produzcan efectos jurídicos o te afecten significativamente de forma similar (artículo 22 del RGPD). La autorización de gasto, las mejoras o cambios de plan y el envío masivo de notificaciones push requieren validación humana.",
        ],
      },
      {
        heading: "8. Conservación",
        paragraphs: [
          "Como política interna, los registros técnicos de hosting se conservan como máximo 90 días, salvo que un incidente de seguridad o una obligación legal exija un plazo distinto.",
          "Los datos de la suscripción VIP se conservan mientras la suscripción esté activa y, tras la baja, el tiempo alineado con las obligaciones de facturación y con las conservaciones que impongan Stripe o la normativa mercantil y fiscal aplicable.",
          "La preferencia de cookies se guarda en localStorage del navegador hasta que la borres o la cambies. La geolocalización no se almacena como histórico de posición.",
        ],
      },
      {
        heading: "9. Derechos y reclamaciones",
        paragraphs: [
          `Puedes ejercer los derechos de acceso, rectificación, cancelación/supresión, oposición, limitación y portabilidad (ARCO+) escribiendo a ${email}.`,
          "Si tienes una suscripción VIP activa, también puedes cancelarla o gestionar el cobro a través del Customer Portal de Stripe, desde el enlace de baja del sitio cuando la suscripción esté activa.",
          "También puedes reclamar ante la Agencia Española de Protección de Datos (AEPD) si consideras que el tratamiento no se ajusta a la normativa.",
        ],
      },
      {
        heading: "10. Menores",
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
    badge: null,
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
    updatedLabel: "Actualizado 8 de septiembre de 2026 · NIF y domicilio pendientes",
    badge: LEGAL_IDENTITY_PENDING_NOTE,
    sections: [
      {
        heading: "1. Titular del portal",
        paragraphs: [
          `Titular del portal: contacto ${email}. NIF ${nif}, domicilio ${domicilio}, pendientes hasta completar los datos identificativos del titular.`,
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
    badge: null,
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
