import type { Metadata } from "next";
import Link from "next/link";
import { getVipCustomerPortalLoginUrl, VIP_PORTAL_API_PATH } from "@/lib/vip-paths";

export const metadata: Metadata = {
  title: { absolute: "Cancelar suscripción VIP" },
  description: "Baja de la suscripción VIP a través del portal de Stripe (test / PRE).",
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
    title: "Falta la clave de Stripe en PRE",
    body: "En Vercel PRE hay que setear STRIPE_SECRET_KEY con el secret de test (sk_test_…), nunca sk_live_.",
  },
  live_secret_blocked: {
    title: "Clave live bloqueada",
    body: "Este flujo solo admite STRIPE_SECRET_KEY de test (sk_test_…). No uses una clave live.",
  },
  portal_not_enabled: {
    title: "Portal no activado aún",
    body: "Activa el Customer Portal en el Dashboard de Stripe (modo test): Settings → Billing → Customer portal, con cancelación encendida. Luego reintenta.",
  },
  no_subscription: {
    title: "Necesitas una suscripción activa",
    body: "No encontramos un cliente de Stripe con ese email. Usa el email del pago de test o suscríbete primero.",
  },
  invalid: {
    title: "Email no válido",
    body: "Introduce el email con el que pagaste en Stripe (test).",
  },
  stripe_error: {
    title: "No se pudo abrir el portal",
    body: "Stripe no creó la sesión. Revisa el Customer Portal en modo test e inténtalo de nuevo.",
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
        Canal VIP · PRE
      </p>
      <h1 className="mt-4 font-display text-4xl font-black text-ink">Cancelar suscripción</h1>
      <p className="mt-4 text-lg text-ink/70">
        Introduce el email del pago para abrir el Customer Portal de Stripe (test) y
        darte de baja en un clic.
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
          <span className="text-sm font-bold text-ink">Email del pago</span>
          <input
            type="email"
            name="email"
            required
            defaultValue={email}
            autoComplete="email"
            placeholder="Introduce el email del pago"
            className="mt-2 w-full rounded-2xl border border-forest/15 bg-white px-4 py-3 text-ink outline-none ring-gold focus:ring-2"
          />
        </label>
        <button
          type="submit"
          className="inline-flex rounded-full bg-forest px-5 py-3 text-sm font-bold text-white"
        >
          Abrir portal y cancelar
        </button>
      </form>

      {loginUrl ? (
        <p className="mt-6 text-sm text-ink/70">
          O entra directo al{" "}
          <a
            href={loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-atlantic underline"
          >
            portal de Stripe
          </a>
          .
        </p>
      ) : null}

      <p className="mt-8 text-sm text-ink/55">
        <Link href="/correr#vip" className="font-semibold text-atlantic hover:underline">
          Volver al Canal VIP
        </Link>
      </p>
    </article>
  );
}
