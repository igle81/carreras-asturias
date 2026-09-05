import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-forest/10 bg-forest text-fog">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl font-bold">Carreras Asturias</p>
          <p className="mt-2 max-w-md text-sm text-fog/75">
            El calendario vivo de las montañas, el asfalto y el ciclismo.
            Inscripciones, concejos y la próxima dorsal que no se te puede escapar.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-fog/80">
          <Link href="/calendario" className="hover:text-gold">
            Calendario
          </Link>
          <Link href="/#recien" className="hover:text-gold">
            Recién abiertas
          </Link>
          <Link href="/#vip" className="hover:text-gold">
            Canal VIP
          </Link>
        </div>
      </div>
    </footer>
  );
}
