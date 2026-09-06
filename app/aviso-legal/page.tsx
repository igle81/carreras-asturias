import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL_DOCUMENTS } from "@/lib/legal";

const document = LEGAL_DOCUMENTS["aviso-legal"];

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
};

export default function AvisoLegalPage() {
  return <LegalPage document={document} />;
}
