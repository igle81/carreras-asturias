const HOSTS = new Set([
  "inscripciones.empa-t.com",
  "www.321go.es",
  "321go.es",
  "rtsfiles.blob.core.windows.net",
  "i0.wp.com",
  "cicloturistaelgamoniteiro.es",
  "www.desafioelacebo.es",
  "desafioelacebo.es",
  "trailsantabarbara.com",
  "ccnorte.com",
  "trailruntemple.com",
  "endurastur.es",
  "www.avaibooksports.com",
  "s3.eu-west-1.amazonaws.com",
  "blogger.googleusercontent.com",
  "estaticos-cdn.prensaiberica.es",
]);

function sufijo(hostname: string, dominio: string): boolean {
  return hostname === dominio || hostname.endsWith(`.${dominio}`);
}

/** El optimizador de Next puede servir este cartel en WebP. El resto se deja tal cual. */
export function cartelOptimizable(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (HOSTS.has(host)) return true;
    return sufijo(host, "supabase.co") || sufijo(host, "blob.core.windows.net") || sufijo(host, "wp.com");
  } catch {
    return false;
  }
}
