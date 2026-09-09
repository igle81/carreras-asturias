type EnvLike = Record<string, string | undefined>;

export const VIP_CANCEL_PATH = "/vip/cancelar";
export const VIP_PORTAL_API_PATH = "/api/vip/portal";

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

/** Hosted Stripe Customer Portal login (test). Never invent a URL. */
export function getVipCustomerPortalLoginUrl(env: EnvLike = process.env): string | null {
  const configured = firstNonEmpty(
    env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL,
    env.VIP_CUSTOMER_PORTAL_URL,
  );
  return configured ? asHttpsUrl(configured) : null;
}
