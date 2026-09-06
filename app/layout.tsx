import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { GeoProvider } from "@/components/geo-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getEventos } from "@/lib/events";
import { uniqueConcejos } from "@/lib/geo";
import { filterByModalidad } from "@/lib/modalidad";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
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
  },
  twitter: {
    card: "summary",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
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
    <html lang="es">
      <body className={`${outfit.variable} min-h-screen bg-fog font-sans text-ink antialiased`}>
        <GeoProvider>
          <SiteHeader concejosPie={concejosPie} concejosBici={concejosBici} />
          <main>{children}</main>
          <SiteFooter />
          <CookieBanner />
        </GeoProvider>
      </body>
    </html>
  );
}
