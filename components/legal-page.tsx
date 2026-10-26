import type { ReactNode } from "react";
import type { LegalDocument } from "@/lib/legal";
import { frasePermitida, leerInterruptores } from "@/lib/interruptores-anuncios";

export async function LegalPage({
  document: original,
  accion,
}: {
  document: LegalDocument;
  accion?: ReactNode;
}) {
  // Los textos legales siguen los interruptores de anuncios (Cuadro de Mandos).
  const interruptores = await leerInterruptores();
  const document: LegalDocument = {
    ...original,
    sections: original.sections
      .map((s) => ({
        ...s,
        paragraphs: s.paragraphs.filter((p) => frasePermitida(p, interruptores)),
        bullets: s.bullets?.filter((b) => frasePermitida(b, interruptores)),
      }))
      .filter((s) => s.paragraphs.length > 0 || (s.bullets?.length ?? 0) > 0),
  };
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {document.badge ? (
        <p className="inline-flex rounded-full border border-forest/15 bg-white px-3 py-1 text-xs font-semibold text-ink/70">
          {document.badge}
        </p>
      ) : null}
      <h1
        className={`${document.badge ? "mt-4" : ""} font-display text-4xl font-black text-ink`}
      >
        {document.title}
      </h1>
      <p className="mt-2 text-sm text-ink/75">{document.updatedLabel}</p>
      <p className="mt-4 text-lg text-ink/70">{document.description}</p>
      {accion ? <div className="mt-6">{accion}</div> : null}

      <div className="mt-10 space-y-8 text-[17px] leading-relaxed text-ink/85">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-bold text-forest">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3">
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
