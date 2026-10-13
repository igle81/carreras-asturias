import type { NextConfig } from "next";
import { CABECERAS_SEGURIDAD } from "./lib/cabeceras";

const onesignalWorkerHeaders = [
  { key: "Service-Worker-Allowed", value: "/" },
  { key: "Content-Type", value: "application/javascript; charset=utf-8" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["leaflet"],
  experimental: { inlineCss: true },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: CABECERAS_SEGURIDAD,
      },
      {
        source: "/OneSignalSDKWorker.js",
        headers: onesignalWorkerHeaders,
      },
      {
        source: "/OneSignalSDK.sw.js",
        headers: onesignalWorkerHeaders,
      },
      {
        source: "/OneSignalSDKUpdaterWorker.js",
        headers: onesignalWorkerHeaders,
      },
    ];
  },
  images: {
    formats: ["image/webp"],
    imageSizes: [48, 96, 128, 256, 384, 400],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "inscripciones.empa-t.com" },
      { protocol: "https", hostname: "www.321go.es" },
      { protocol: "https", hostname: "321go.es" },
      { protocol: "https", hostname: "rtsfiles.blob.core.windows.net" },
      { protocol: "https", hostname: "**.blob.core.windows.net" },
      { protocol: "https", hostname: "i0.wp.com" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "cicloturistaelgamoniteiro.es" },
      { protocol: "https", hostname: "www.desafioelacebo.es" },
      { protocol: "https", hostname: "desafioelacebo.es" },
      { protocol: "https", hostname: "trailsantabarbara.com" },
      { protocol: "https", hostname: "ccnorte.com" },
      { protocol: "https", hostname: "trailruntemple.com" },
      { protocol: "https", hostname: "endurastur.es" },
      { protocol: "https", hostname: "www.avaibooksports.com" },
      { protocol: "https", hostname: "s3.eu-west-1.amazonaws.com" },
      { protocol: "https", hostname: "blogger.googleusercontent.com" },
      { protocol: "https", hostname: "estaticos-cdn.prensaiberica.es" },
    ],
  },
};

export default nextConfig;
