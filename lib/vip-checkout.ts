/** Stripe test Payment Link — PRE / preview fallback only. */
export const STRIPE_TEST_PAYMENT_LINK =
  "https://buy.stripe.com/test_eVq00l7Wx4Z20YM2REgnK00";

type EnvLike = Record<string, string | undefined>;

function firstNonEmpty(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function asHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return value;
  } catch {
    return null;
  }
}

/**
 * Allow the hardcoded test Payment Link only on non-production surfaces:
 * local/dev, Vercel preview (rama `pre`), or an explicit public flag.
 * Production (main) stays «Próximamente» unless a checkout URL is set.
 */
export function isVipCheckoutFallbackAllowed(env: EnvLike = process.env): boolean {
  if (env.NEXT_PUBLIC_VIP_CHECKOUT_ENABLED === "true") return true;

  const vercelEnv = env.VERCEL_ENV || env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercelEnv === "preview") return true;

  const gitRef = env.VERCEL_GIT_COMMIT_REF || env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF;
  if (gitRef === "pre") return true;

  return env.NODE_ENV === "development" || env.NODE_ENV === "test";
}

/** Prefer Vercel env; otherwise the test link on PRE/preview/dev only. */
export function getVipCheckoutUrl(env: EnvLike = process.env): string | null {
  const configured = firstNonEmpty(
    env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK,
    env.VIP_CHECKOUT_URL,
    env.NEXT_PUBLIC_VIP_CHECKOUT_URL,
  );
  if (configured) return asHttpsUrl(configured);

  if (isVipCheckoutFallbackAllowed(env)) return STRIPE_TEST_PAYMENT_LINK;
  return null;
}
