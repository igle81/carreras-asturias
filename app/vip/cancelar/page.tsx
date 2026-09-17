import type { Metadata } from "next";
import Link from "next/link";
import { getVipCustomerPortalLoginUrl, VIP_PORTAL_API_PATH } from "@/lib/vip-paths";

export const metadata: Metadata = {
  title: { absolute: "Cancelar suscripción VIP" },
  description: "Cancela el aviso VIP con el email con el que pagaste.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  missing_secret: {
    title: "Ahora mismo no se puede abrir la baja",
    body: "Inténtalo más tarde.",
  },
  live_secret_blocked: {
    title: "Ahora mismo no se puede abrir la baja",
    body: "Inténtalo más tarde.",
  },
  portal_not_enabled: {
    title: "Ahora mismo no se puede abrir la baja",
    body: "Inténtalo más tarde.",
  },
  no_subscription: {
    title: "No encontramos ese email",
    body: "Revisa que sea el email con el que pagaste.",
  },
  invalid: {
    title: "Ese email no parece válido",
    body: "Escribe el email con el que pagaste.",
  },
  stripe_error: {
    title: "Ahora mismo no se puede abrir la baja",
    body: "Inténtalo más tarde.",
  },
};

export default async function VipCancelarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? ERROR_COPY[params.error] : null;
  const email = params.email?.trim() ?? "";
  const loginUrl = getVipCustomerPortalLoginUrl();

  return (
    <article className="mx-auto max-w-xl px-4 py-12">
      <p className="inline-flex rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-forest">
        Aviso VIP
      </p>
      <h1 className="mt-4 font-display text-4xl font-black text-ink">Cancelar suscripción</h1>
      <p className="mt-4 text-lg text-ink/70">
        Escribe el email con el que pagaste y cancela en un clic.
      </p>

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border-2 border-fire/30 bg-fire/10 px-4 py-3"
        >
          <p className="font-bold text-ink">{error.title}</p>
          <p className="mt-1 text-sm text-ink/75">{error.body}</p>
        </div>
      ) : null}

      <form action={VIP_PORTAL_API_PATH} method="post" className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-ink">Email con el que pagaste</span>
          <input
            type="email"
            name="email"
            required
            defaultValue={email}
            autoComplete="email"
            placeholder="El email con el que pagaste"
            className="mt-2 w-full rounded-2xl border border-forest/15 bg-white px-4 py-3 text-ink outline-none ring-gold focus:ring-2"
          />
        </label>
        <button
          type="submit"
          className="inline-flex rounded-full bg-forest px-5 py-3 text-sm font-bold text-white"
        >
          Cancelar en un clic
        </button>
      </form>

      {loginUrl ? (
        <p className="mt-6 text-sm text-ink/70">
          O abre la{" "}
          <a
            href={loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-atlantic underline"
          >
            página de baja
          </a>
          .
        </p>
      ) : null}

      <p className="mt-8 text-sm text-ink/55">
        <Link href="/correr" className="font-semibold text-atlantic hover:underline">
          Volver a correr
        </Link>
      </p>
    </article>
  );
}
