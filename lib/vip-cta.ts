import { getSupabase } from "./supabase";

export const VIP_CTA_COUNT_RPC = "vip_cta_clicks_count";
export const VIP_CTA_INSERT_RPC = "vip_cta_clicks_registrar";

const MAX_PATH = 300;
const RUTA_VIP = /^\/[A-Za-z0-9._~%/]*$/;

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

/** Ruta interna. Null si no es un path del sitio (sin esquema, query ni `..`). */
export function rutaVipValida(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_PATH) return null;
  if (!RUTA_VIP.test(trimmed)) return null;
  if (trimmed.includes("//") || trimmed.includes("..")) return null;
  return trimmed;
}

const FAMILIAS = ["Edge", "Opera", "Samsung", "Firefox", "Chrome", "Safari", "Otro"] as const;

/** Solo la familia del navegador. El user-agent completo no se guarda. */
export function familiaNavegador(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const bruto = value.trim();
  if (!bruto) return null;
  const ua = bruto.slice(0, 400).toLowerCase();
  const conocida = FAMILIAS.find((nombre) => nombre.toLowerCase() === ua);
  if (conocida) return conocida;
  if (ua.includes("edg/") || ua.includes("edge/")) return "Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("samsungbrowser")) return "Samsung";
  if (ua.includes("firefox") || ua.includes("fxios")) return "Firefox";
  if (ua.includes("chrome") || ua.includes("crios") || ua.includes("chromium")) return "Chrome";
  if (ua.includes("safari")) return "Safari";
  return "Otro";
}

export async function recordVipCtaClick(input: {
  path?: unknown;
  userAgent?: unknown;
}): Promise<{ recorded: boolean }> {
  try {
    const path = rutaVipValida(input.path);
    if (!path) return { recorded: false };

    const { data, error } = await getSupabase().rpc(VIP_CTA_INSERT_RPC, {
      p_path: path,
      p_user_agent: familiaNavegador(input.userAgent),
    });

    if (!error) return { recorded: data === true };
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
