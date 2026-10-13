/** Cabeceras de seguridad. CSP compatible con AdSense, OneSignal y Supabase. */

/**
 * HSTS con includeSubDomains. Comprobado el 13 oct 2026: el ápice y www
 * responden por HTTPS (el ápice redirige a www); el resto de nombres
 * habituales no resuelven. mail solo tiene MX de OneSignal (sin web) y
 * email.mail (clics de OneSignal) tiene certificado válido. Sin preload.
 * Vercel ya manda max-age=63072000 en dominios propios; esta cabecera
 * sustituye ese valor en las respuestas del despliegue.
 */
export const HSTS = "max-age=63072000; includeSubDomains";

export const CABECERAS_SEGURIDAD: { key: string; value: string }[] = [
  { key: "Strict-Transport-Security", value: HSTS },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  { key: "Content-Security-Policy", value: politicaContenido() },
];

function politicaContenido(): string {
  const directivas = [
    "default-src 'self'",
    [
      "script-src 'self' 'unsafe-inline'",
      "https://pagead2.googlesyndication.com",
      "https://*.googlesyndication.com",
      "https://adservice.google.com",
      "https://fundingchoicesmessages.google.com",
      "https://*.google.com",
      "https://*.gstatic.com",
      "https://*.doubleclick.net",
      "https://www.googletagmanager.com",
      "https://cdn.onesignal.com",
      "https://*.onesignal.com",
    ].join(" "),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.gstatic.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https://*.gstatic.com",
    [
      "connect-src 'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://cdn.onesignal.com",
      "https://*.onesignal.com",
      "https://*.googlesyndication.com",
      "https://*.google.com",
      "https://*.google.es",
      "https://*.doubleclick.net",
      "https://*.g.doubleclick.net",
      "https://fundingchoicesmessages.google.com",
      "https://*.gstatic.com",
      "https://avilesia.es",
      "https://www.avilesia.es",
      "https://*.tile.openstreetmap.org",
    ].join(" "),
    [
      "frame-src",
      "https://googleads.g.doubleclick.net",
      "https://tpc.googlesyndication.com",
      "https://*.googlesyndication.com",
      "https://www.google.com",
      "https://*.google.com",
      "https://fundingchoicesmessages.google.com",
      "https://*.doubleclick.net",
    ].join(" "),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  return directivas.join("; ");
}
