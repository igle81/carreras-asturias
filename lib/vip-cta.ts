import { getSupabase } from "./supabase";

export const VIP_CTA_TABLE = "vip_cta_clicks";
export const VIP_CTA_COUNT_RPC = "vip_cta_clicks_count";

const MAX_PATH = 300;
const MAX_USER_AGENT = 500;

type SupabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

function asMessage(error: SupabaseErrorLike): string {
  return (error?.message ?? "").toLowerCase();
}

/** Table, RPC, or column missing — insert/count should fail closed without breaking the UI. */
export function isMissingVipCtaSchema(error: SupabaseErrorLike): boolean {
  if (!error) return false;
  const message = asMessage(error);
  const code = error.code ?? "";
  if (code === "42P01" || code === "PGRST202" || code === "PGRST205") return true;
  return (
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("could not find the function") ||
    message.includes("schema cache")
  );
}

export function sanitizeVipCtaPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "/";
  return trimmed.slice(0, MAX_PATH);
}

export function sanitizeUserAgent(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_USER_AGENT);
}

export async function recordVipCtaClick(input: {
  path?: unknown;
  userAgent?: unknown;
}): Promise<{ recorded: boolean }> {
  try {
    const { error } = await getSupabase().from(VIP_CTA_TABLE).insert({
      path: sanitizeVipCtaPath(input.path),
      user_agent: sanitizeUserAgent(input.userAgent),
    });

    if (!error) return { recorded: true };
    if (isMissingVipCtaSchema(error)) {
      console.warn("vip_cta_clicks no está lista", error.message);
      return { recorded: false };
    }
    console.error("No se pudo registrar el clic VIP", error.message);
    return { recorded: false };
  } catch (error) {
    console.error("No se pudo registrar el clic VIP", error);
    return { recorded: false };
  }
}

export async function getVipCtaClickCount(): Promise<number | null> {
  try {
    const { data, error } = await getSupabase().rpc(VIP_CTA_COUNT_RPC);
    if (error) {
      if (isMissingVipCtaSchema(error)) {
        console.warn("vip_cta_clicks_count no está lista", error.message);
        return null;
      }
      console.error("No se pudo contar clics VIP", error.message);
      return null;
    }
    const count = typeof data === "number" ? data : Number(data);
    return Number.isFinite(count) ? count : null;
  } catch (error) {
    console.error("No se pudo contar clics VIP", error);
    return null;
  }
}
