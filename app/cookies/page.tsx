import type { Metadata } from "next";
import { ConfigurarCookies } from "@/components/configurar-cookies";
import { LegalPage } from "@/components/legal-page";
import { LEGAL_DOCUMENTS } from "@/lib/legal";

const document = LEGAL_DOCUMENTS.cookies;

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
};

export default function CookiesPage() {
  return (
    <LegalPage
      document={document}
      accion={
        <ConfigurarCookies className="inline-flex rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white" />
      }
    />
  );
}
