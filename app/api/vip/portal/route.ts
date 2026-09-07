import { NextResponse } from "next/server";
import {
  cancelarErrorUrl,
  createBillingPortalSession,
  createStripeClient,
  getStripeSecretKey,
  getVipCustomerPortalLoginUrl,
  isPortalNotEnabledError,
  isStripeLiveSecret,
  isVipPortalAllowed,
  portalReturnUrl,
  resolveStripeCustomerId,
  sanitizeCustomerId,
  sanitizePortalEmail,
  VIP_CANCEL_PATH,
} from "@/lib/vip-portal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PortalInput = {
  customer?: unknown;
  email?: unknown;
};

function originFromReturnUrl(returnUrl: string): string {
  return new URL(returnUrl).origin;
}

function redirectTo(url: string) {
  return NextResponse.redirect(url, 303);
}

async function readInput(request: Request): Promise<PortalInput> {
  const url = new URL(request.url);
  const input: PortalInput = {
    customer: url.searchParams.get("customer") ?? undefined,
    email: url.searchParams.get("email") ?? undefined,
  };

  if (request.method !== "POST") return input;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as PortalInput;
      return {
        customer: body.customer ?? input.customer,
        email: body.email ?? input.email,
      };
    }
    const form = await request.formData();
    return {
      customer: form.get("customer") ?? input.customer,
      email: form.get("email") ?? input.email,
    };
  } catch {
    return input;
  }
}

async function handlePortal(request: Request) {
  const returnUrl = portalReturnUrl(request);
  const origin = originFromReturnUrl(returnUrl);

  if (!isVipPortalAllowed()) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const input = await readInput(request);
  const customerId = sanitizeCustomerId(input.customer);
  const email = sanitizePortalEmail(input.email);
  const loginUrl = getVipCustomerPortalLoginUrl();

  if (input.email && !email && !customerId) {
    return redirectTo(cancelarErrorUrl(origin, "invalid"));
  }

  if (!customerId && !email) {
    if (loginUrl) return redirectTo(loginUrl);
    return redirectTo(new URL(VIP_CANCEL_PATH, `${origin}/`).toString());
  }

  const secret = getStripeSecretKey();
  if (!secret) {
    if (loginUrl) return redirectTo(loginUrl);
    return redirectTo(cancelarErrorUrl(origin, "missing_secret", email ?? undefined));
  }
  if (isStripeLiveSecret(secret)) {
    return redirectTo(cancelarErrorUrl(origin, "live_secret_blocked", email ?? undefined));
  }

  const stripe = createStripeClient(secret);

  try {
    const resolved = await resolveStripeCustomerId(stripe, { customerId, email });
    if (!resolved) {
      return redirectTo(cancelarErrorUrl(origin, "no_subscription", email ?? undefined));
    }

    const portalUrl = await createBillingPortalSession(stripe, resolved, returnUrl);
    return redirectTo(portalUrl);
  } catch (error) {
    console.error("VIP portal session failed", error);
    if (isPortalNotEnabledError(error)) {
      return redirectTo(cancelarErrorUrl(origin, "portal_not_enabled", email ?? undefined));
    }
    return redirectTo(cancelarErrorUrl(origin, "stripe_error", email ?? undefined));
  }
}

export async function GET(request: Request) {
  return handlePortal(request);
}

export async function POST(request: Request) {
  return handlePortal(request);
}
