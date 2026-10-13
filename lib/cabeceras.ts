/** Cabeceras de seguridad. CSP compatible con AdSense, OneSignal y Supabase. */

export const CABECERAS_SEGURIDAD: { key: string; value: string }[] = [
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
      "https://www.googletagmanager.com",
      "https://cdn.onesignal.com",
      "https://*.onesignal.com",
    ].join(" "),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
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
    ].join(" "),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  return directivas.join("; ");
}
