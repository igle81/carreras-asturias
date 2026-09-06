import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { GeoProvider } from "@/components/geo-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getEventos } from "@/lib/events";
import { uniqueConcejos } from "@/lib/geo";
import { filterByModalidad } from "@/lib/modalidad";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Carreras Asturias",
    template: "%s · Carreras Asturias",
  },
  description:
    "Calendario vivo de carreras a pie y ciclismo en Asturias. Trail, asfalto, bici, inscripciones recién abiertas y mapa por concejo.",
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
