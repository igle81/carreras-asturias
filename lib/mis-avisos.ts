/**
 * Textos y reglas pequeñas de la página Mis avisos (/avisos), separados del componente para poder probarlos.
 */

/** RPC SECURITY DEFINER (auth.uid()) que deshace la baja de la propia fila. Migración 20261018221141. */
export const RPC_REACTIVAR_CORREO = "avisos_reactivar_correo";

export const TEXTO_VOLVER_CORREO = "Volver a recibir avisos por correo";

/** Si Telegram ya está conectado, el botón no puede decir «Conectar». */
export function textoBotonTelegram(conectado: boolean): string {
  return conectado ? "Volver a conectar Telegram" : "Conectar Telegram";
}

export function textoEstadoCorreo(bajaEn: string | null | undefined, correo: string | null | undefined): string {
  if (bajaEn) return "Los avisos por correo están de baja.";
  return `Te escribimos a ${correo || "tu correo"}.`;
}

export const MENSAJE_CORREO_REACTIVADO =
  "Vuelves a recibir avisos por correo. Las notificaciones de este móvil y Telegram se activan aparte, aquí mismo.";
