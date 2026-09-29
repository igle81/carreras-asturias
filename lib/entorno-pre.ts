type EnvLike = Record<string, string | undefined>;

function limpiar(value: string | undefined): string {
  return value?.trim() ?? "";
}

/**
 * PRE de Carreras Asturias: despliegue de vista previa o rama `pre`.
 * Producción y la ausencia de señal devuelven false (la franja no se pinta).
 */
export function esEntornoPre(env: EnvLike = process.env): boolean {
  const vercelEnv = limpiar(env.VERCEL_ENV || env.NEXT_PUBLIC_VERCEL_ENV);
  const vercelEnvPublico = limpiar(env.NEXT_PUBLIC_VERCEL_ENV);

  if (vercelEnv === "production" || vercelEnvPublico === "production") return false;
  if (vercelEnv === "preview") return true;

  const gitRef = limpiar(env.VERCEL_GIT_COMMIT_REF || env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF);
  return gitRef === "pre";
}
