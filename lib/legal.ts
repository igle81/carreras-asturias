export const LEGAL_PLACEHOLDERS = {
  titular: "Javier Iglesias",
  nif: "71880314R",
  domicilio: "C/ Juan XXIII, 33400 Avilés (Asturias)",
  email: "avilesia2026@gmail.com",
} as const;

export const COOKIE_CONSENT_KEY = "ca-cookie-consent";
export const COOKIE_CONSENT_EVENT = "ca-consent";
export const COOKIE_CONSENT_VERSION = 1 as const;

/**
 * Versión del texto de Privacidad que acepta quien se da de alta o vuelve a recibir avisos.
 * Es la fecha de «Actualizado» de la Política de privacidad. Si cambias ese texto, súbela aquí
 * y en carreras.consentimiento_version_vigente() (Supabase); un test comprueba que coinciden.
 */
export const PRIVACIDAD_VERSION = "2026-10-19" as const;

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

const { titular, nif, domicilio, email } = LEGAL_PLACEHOLDERS;

export const LEGAL_DOCUMENTS: Record<LegalDocument["slug"], LegalDocument> = {
  privacidad: {
    slug: "privacidad",
    title: "Política de privacidad",
    description:
      "Cómo trata Carreras Asturias los datos personales: cuenta, avisos, encargados y derechos.",
    updatedLabel: "Actualizado 19 de octubre de 2026",
    badge: null,
    sections: [
      {
        heading: "1. Responsable del tratamiento",
        paragraphs: [
          `Responsable: ${titular}. NIF ${nif}. Domicilio: ${domicilio}. Contacto: ${email}.`,
        ],
      },
      {
        heading: "2. Datos que se tratan",
        paragraphs: [
          "Si creas una cuenta, tratamos el correo, la contraseña (la guarda Supabase Auth; esta web no la almacena en claro), el correo donde quieres los avisos y el momento del consentimiento. La fila está en el esquema carreras de Supabase y cada persona solo ve la suya.",
        ],
        bullets: [
          "Registros técnicos de seguridad y funcionamiento (dirección IP, user-agent, ruta y marca temporal) generados por el hosting.",
          "Geolocalización del navegador solo si la activas con el botón de cercanía. Las coordenadas se usan en el dispositivo para calcular distancias y no se guardan como un perfil persistente de ubicación.",
          "Preferencia de cookies en el navegador (localStorage, clave `ca-cookie-consent`).",
          "Si conectas Telegram, el identificador del chat privado con el bot @AvilesIA_bot. El aviso te llega a ese chat, que solo ves tú.",
          "Si activas los avisos en el móvil o el navegador con la sesión iniciada, OneSignal vincula ese dispositivo a tu user_id. Sin sesión no se asocia el navegador a un identificador de otra persona.",
          "Registro de envíos de avisos: identificador de usuario, canal (correo, notificación o Telegram), aviso, resultado (un código corto) y fecha. No guardamos el contenido del mensaje ni la dirección de destino. Sirve para no repetir un aviso y comprobar que llega.",
          "Registro de consentimientos: cuándo te das de alta, de baja o vuelves a recibir avisos, con la versión de este texto que aceptaste y desde dónde (web, Mis avisos o enlace del correo). Es la prueba de tu consentimiento; solo se añaden líneas, no se modifican.",
          "Cada correo de aviso lleva un enlace de baja de un solo uso. Solo guardamos su huella (hash), no el enlace, junto a tu user_id y su fecha de caducidad.",
          "Si pulsas el enlace de afiliación, la ruta de la página para contar el clic. Al seguir el enlace, Decathlon (y, en su caso, su red Awin) trata la visita según su propia política.",
          "Si pulsas el aviso VIP, la ruta de la página y la familia del navegador (Chrome, Firefox, Safari u otra). No guardamos el user-agent completo.",
          "Si aceptas las cookies no esenciales, Google AdSense puede guardar identificadores para mostrar y medir anuncios. Hasta que pulsas Aceptar, el script no se descarga.",
        ],
      },
      {
        heading: "3. Avisos por correo, Telegram y push",
        paragraphs: [
          "Los avisos de inscripciones salen por el correo que indicas, por un chat privado con @AvilesIA_bot si lo conectas en Mis avisos, y por notificación de OneSignal si activas el permiso en ese mismo sitio con la sesión iniciada.",
          "El código de OneSignal no se descarga hasta que pulsas el botón. Puedes darte de baja de los avisos en Mis avisos y revocar el permiso en el navegador.",
          "Cada correo de aviso lleva un enlace para darte de baja sin iniciar sesión: primero te pide confirmar y la baja corta todos los canales. En Mis avisos también puedes desactivar las notificaciones o desconectar Telegram por separado, sin perder los demás avisos. Si te das de baja y cambias de idea, en Mis avisos puedes volver a recibir avisos por correo: cuenta como un nuevo consentimiento y las notificaciones y Telegram se vuelven a activar aparte.",
        ],
      },
      {
        heading: "4. Finalidades y bases jurídicas",
        paragraphs: ["Tratamos datos solo para las finalidades siguientes:"],
        bullets: [
          "Mostrar el calendario de carreras y ciclismo en Asturias (interés legítimo en informar sobre eventos públicos).",
          "Garantizar la seguridad, limitar abusos del alta y el correcto funcionamiento del sitio (interés legítimo).",
          "Crear la cuenta y enviarte los avisos que pides (ejecución de la solicitud; el consentimiento que marcas en el alta).",
          "Confirmar que el correo es tuyo (ejecución de la solicitud).",
          "Avisar al administrador por correo cuando hay un alta nueva (interés legítimo en operar el servicio).",
          "Enviarte el aviso por Telegram a @AvilesIA_bot y por OneSignal si lo activas (consentimiento).",
          "Calcular carreras cercanas cuando activas la geolocalización (consentimiento).",
          "Cookies y publicidad de Google AdSense, solo si pulsas Aceptar (consentimiento).",
          "Medir clics del enlace de afiliación a Decathlon (interés legítimo).",
          "Atender consultas y el ejercicio de derechos en el buzón de contacto (interés legítimo y, cuando aplique, obligación legal).",
        ],
      },
      {
        heading: "5. Destinatarios y encargados",
        paragraphs: [
          "No vendemos datos personales. Los tratamientos se apoyan en proveedores que actúan como encargados o como responsables independientes según el servicio:",
        ],
        bullets: [
          "Vercel: alojamiento y entrega del sitio.",
          "Supabase: autenticación de la cuenta, base de datos de eventos y filas de avisos.",
          "Google AdSense: publicidad, solo después de Aceptar en el banner. Cliente ca-pub-5660728155340779.",
          "OneSignal: notificaciones en el navegador o el móvil, solo si las activas con la sesión iniciada.",
          "Telegram (@AvilesIA_bot): chat privado de avisos si pulsas Conectar Telegram.",
          "Decathlon y su red de afiliación Awin: solo si abres el enlace patrocinado. No les enviamos tu correo.",
          `Gmail (Google): buzón de contacto ${email} para consultas y derechos.`,
          "Gmail (Google), cuenta SMTP de AvilesIA: envío de los avisos por correo.",
          "n8n (automatización propia de AvilesIA en un servidor de OVHcloud): prepara y envía los avisos por correo, notificación y Telegram, y guarda el registro de envíos.",
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
          "No adoptamos decisiones basadas únicamente en un tratamiento automatizado que produzcan efectos jurídicos o te afecten significativamente de forma similar (artículo 22 del RGPD). La autorización de gasto y las mejoras o cambios de plan requieren validación humana. Los avisos que pides (aperturas de inscripción y clasificaciones) salen de forma automática a quien los tiene activados; las campañas masivas de notificaciones push requieren validación humana.",
        ],
      },
      {
        heading: "8. Conservación",
        paragraphs: [
          "Como política interna, los registros técnicos de hosting se conservan como máximo 90 días, salvo que un incidente de seguridad o una obligación legal exija un plazo distinto.",
          "El correo de avisos y los datos de la suscripción se conservan mientras no te des de baja. Tras la baja, en un plazo de 30 días se vacían (correo, nombre e Instagram) y se borran el registro de envíos y los enlaces de baja de esa cuenta, salvo que una obligación legal exija guardarlos más. Solo se conservan el identificador de usuario y la fecha de la baja, para no volver a enviarte avisos. El registro de consentimientos de esa cuenta se borra en la misma pasada. Si vuelves tras la purga, solo recuperamos el correo de tu cuenta.",
          `La baja de los avisos no borra la cuenta de acceso (correo y contraseña en Supabase Auth). Si quieres borrarla también, escríbenos a ${email}.`,
          "El identificador de Telegram se borra al pulsar Desconectar Telegram en Mis avisos, al darte de baja (en el momento si usas el enlace del correo; en la pasada diaria, como máximo en 24 horas, si lo haces en Mis avisos) y si bloqueas el bot.",
          "Al pulsar Desactivar notificaciones en Mis avisos, o al darte de baja, dejamos de enviarte notificaciones. En el navegador donde pulses Desactivar notificaciones también se quita su vínculo con tu user_id en OneSignal. Si el navegador avisa de que ya no tiene la suscripción, dejamos de enviarle notificaciones.",
          "El registro de envíos de avisos se conserva 90 días y después se borra automáticamente. Los enlaces de baja caducan a los 60 días y se borran 30 días después.",
          "La preferencia de cookies se guarda en localStorage del navegador hasta que la borres o la cambies. La geolocalización no se almacena como histórico de posición.",
          "Los clics de afiliación, si la tabla existe, se conservan como máximo 12 meses.",
          "Los clics del aviso VIP (ruta y familia del navegador) se conservan como máximo 12 meses. Al registrar un clic nuevo se borran los que ya han cumplido ese plazo.",
        ],
      },
      {
        heading: "9. Derechos y reclamaciones",
        paragraphs: [
          `Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${email}. También puedes darte de baja de los avisos en Mis avisos.`,
          "Responderemos en el plazo de un mes. Si la solicitud es compleja, el plazo puede ampliarse otros dos meses y te lo diremos.",
          "También puedes reclamar ante la Agencia Española de Protección de Datos (AEPD), C/ Jorge Juan 6, 28001 Madrid, si consideras que el tratamiento no se ajusta a la normativa.",
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
      "Cookies y almacenamientos de Carreras Asturias: técnicas, preferencias, Google AdSense y analítica no activa.",
    updatedLabel: "Actualizado 13 de octubre de 2026",
    badge: null,
    sections: [
      {
        heading: "1. Qué usamos hoy",
        paragraphs: [
          "Carreras Asturias no descarga publicidad hasta que pulsas Aceptar. El modo de consentimiento de Google queda denegado por defecto. Cargamos el mensaje de consentimiento certificado de Google (CMP) solo para mostrarte el aviso; hasta que decides no se usan cookies publicitarias. El script de AdSense (cliente ca-pub-5660728155340779) solo se pide entonces, y no en las páginas de cuenta (/registro, /avisos). El anuncio entre tarjetas solo se pinta si además hay un espacio configurado.",
          "Los avisos de aperturas y clasificaciones son aparte: el código de OneSignal solo se descarga si pulsas «Activar avisos». Puedes desactivarlos después en la configuración del navegador.",
        ],
      },
      {
        heading: "2. Categorías",
        paragraphs: ["Clasificamos las cookies y almacenamientos así:"],
        bullets: [
          "Necesarias / técnicas: imprescindibles para mostrar el sitio, recordar la decisión del banner (`ca-cookie-consent` en localStorage) y el funcionamiento básico.",
          "Preferencias: concejo o modalidad si se persisten en el navegador para no preguntar en cada visita.",
          "Analítica: no activa hoy.",
          "Publicidad: Google AdSense, solo si pulsas Aceptar. Puede guardar cookies de Google para mostrar y medir anuncios. En /registro y /avisos no se carga.",
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
          "En la primera visita aparece un banner con «Aceptar» y «Rechazar no esenciales», salvo que Google ya muestre su propio mensaje de consentimiento: en ese caso usamos ese y no duplicamos el aviso. «Aceptar» guarda la elección en localStorage (`ca-cookie-consent`) y solo entonces se pide el script de AdSense. «Rechazar no esenciales» guarda también la elección (sin publicidad) para no volver a preguntar, y no carga publicidad. Puedes cambiarla cuando quieras desde «Configurar cookies».",
          "Puedes cambiar de idea con «Configurar cookies», en el pie y en esta página. Si está el mensaje de Google, ese enlace abre su panel. Si no, reabre nuestro banner. Al rechazar se retira el consentimiento y dejan de cargarse los anuncios.",
        ],
      },
    ],
  },
  "aviso-legal": {
    slug: "aviso-legal",
    title: "Aviso legal",
    description:
      "Titularidad, carácter informativo y limitación de responsabilidad del portal Carreras Asturias.",
    updatedLabel: "Actualizado 13 de octubre de 2026",
    badge: null,
    sections: [
      {
        heading: "1. Titular del portal",
        paragraphs: [
          `Titular: ${titular}. NIF ${nif}. Domicilio: ${domicilio}. Contacto: ${email}.`,
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
    updatedLabel: "Actualizado 13 de octubre de 2026",
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
