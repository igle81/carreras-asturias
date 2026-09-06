import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL_DOCUMENTS } from "@/lib/legal";

const document = LEGAL_DOCUMENTS.privacidad;

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
};

export default function PrivacidadPage() {
  return <LegalPage document={document} />;
}
