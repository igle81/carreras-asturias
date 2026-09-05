import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-atlantic">404</p>
      <h1 className="mt-2 font-display text-3xl font-black text-ink">
        Esta carrera se ha perdido en la niebla
      </h1>
      <p className="mt-3 text-ink/65">
        No encontramos esa ficha. Vuelve al calendario y elige otro dorsal.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-forest px-5 py-3 text-sm font-bold text-white"
      >
        Ir al calendario
      </Link>
    </div>
  );
}
