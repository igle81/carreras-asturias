import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Diferidos } from "@/components/diferidos";
import { GeoProvider } from "@/components/geo-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CONSENT_DEFAULT_SCRIPT } from "@/lib/adsense";
import { getEventos } from "@/lib/events";
import { uniqueConcejos } from "@/lib/geo";
import { filterByModalidad } from "@/lib/modalidad";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "192x192" }],
  },
  category: "sports",
};

export const revalidate = 60;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const events = await getEventos();
  const concejosPie = uniqueConcejos(filterByModalidad(events, "pie"));
  const concejosBici = uniqueConcejos(filterByModalidad(events, "ciclismo"));

  return (
    <html lang="es" data-avilesia-barra="on">
      <head>
        <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />
      </head>
      <body className={`${outfit.variable} min-h-screen bg-fog font-sans text-ink antialiased`}>
        <GeoProvider>
          <div className="sticky top-0 z-40">
            <SiteHeader concejosPie={concejosPie} concejosBici={concejosBici} />
          </div>
          <main>{children}</main>
          <SiteFooter />
          <Diferidos />
        </GeoProvider>
      </body>
    </html>
  );
}
