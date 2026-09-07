import type { NextConfig } from "next";

const onesignalWorkerHeaders = [
  { key: "Service-Worker-Allowed", value: "/" },
  { key: "Content-Type", value: "application/javascript; charset=utf-8" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["leaflet", "react-leaflet"],
  async headers() {
    return [
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
    ],
  },
};

export default nextConfig;
