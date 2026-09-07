import Stripe from "stripe";
import { isVipCheckoutFallbackAllowed } from "@/lib/vip-checkout";
import { VIP_CANCEL_PATH } from "@/lib/vip-paths";

export { VIP_CANCEL_PATH, VIP_PORTAL_API_PATH, getVipCustomerPortalLoginUrl } from "@/lib/vip-paths";

/** Documented PRE deploy — used only if the request host is missing. */
export const VIP_PRE_FALLBACK_ORIGIN =
  "https://carreras-asturias-git-pre-javiers-projects-32052beb.vercel.app";

const CUSTOMER_ID = /^cus_[A-Za-z0-9]+$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EnvLike = Record<string, string | undefined>;

export type PortalErrorCode =
  | "missing_secret"
  | "live_secret_blocked"
  | "portal_not_enabled"
  | "no_subscription"
  | "invalid"
  | "stripe_error";

export function isVipPortalAllowed(env: EnvLike = process.env): boolean {
  return isVipCheckoutFallbackAllowed(env);
}

export function getStripeSecretKey(env: EnvLike = process.env): string | null {
  const key = env.STRIPE_SECRET_KEY?.trim();
  return key || null;
}

export function isStripeLiveSecret(key: string): boolean {
  return key.startsWith("sk_live_");
}

export function sanitizeCustomerId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return CUSTOMER_ID.test(trimmed) ? trimmed : null;
}

export function sanitizePortalEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254 || !EMAIL.test(trimmed)) return null;
  return trimmed;
}

export function portalReturnUrl(request: Request): string {
  const protoHeader = request.headers.get("x-forwarded-proto");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto =
      protoHeader ?? (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}/`;
  }
  return `${VIP_PRE_FALLBACK_ORIGIN}/`;
}

export function cancelarErrorUrl(origin: string, code: PortalErrorCode, email?: string): string {
  const url = new URL(VIP_CANCEL_PATH, origin.endsWith("/") ? origin : `${origin}/`);
  url.searchParams.set("error", code);
  if (email) url.searchParams.set("email", email);
  return url.toString();
}

export function isPortalNotEnabledError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code ?? "").toLowerCase()
      : "";

  if (code.includes("billing_portal") || code.includes("portal")) return true;
  return (
    message.includes("customer portal") ||
    message.includes("portal session") ||
    message.includes("portal settings") ||
    (message.includes("portal") &&
      (message.includes("configuration") ||
        message.includes("activat") ||
        message.includes("not been") ||
        message.includes("save your")))
  );
}

export function createStripeClient(secret: string): Stripe {
  return new Stripe(secret);
}

export async function resolveStripeCustomerId(
  stripe: Stripe,
  input: { customerId?: string | null; email?: string | null },
): Promise<string | null> {
  if (input.customerId) return input.customerId;
  if (!input.email) return null;

  const listed = await stripe.customers.list({ email: input.email, limit: 10 });
  if (listed.data.length === 0) return null;

  for (const customer of listed.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 5,
    });
    const usable = subs.data.find((sub) =>
      ["active", "trialing", "past_due", "unpaid"].includes(sub.status),
    );
    if (usable) return customer.id;
  }

  return listed.data[0]?.id ?? null;
}

export async function createBillingPortalSession(
  stripe: Stripe,
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
