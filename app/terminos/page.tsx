import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL_DOCUMENTS } from "@/lib/legal";

const document = LEGAL_DOCUMENTS.terminos;

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
};

export default function TerminosPage() {
  return <LegalPage document={document} />;
}
