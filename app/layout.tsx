import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { GeoProvider } from "@/components/geo-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getEventos } from "@/lib/events";
import { uniqueConcejos } from "@/lib/geo";
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

export const revalidate = 180;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const events = await getEventos();
  const concejos = uniqueConcejos(events);

  return (
    <html lang="es">
      <body className={`${outfit.variable} min-h-screen bg-fog font-sans text-ink antialiased`}>
        <GeoProvider>
          <SiteHeader concejos={concejos} />
          <main>{children}</main>
          <SiteFooter />
        </GeoProvider>
      </body>
    </html>
  );
}
