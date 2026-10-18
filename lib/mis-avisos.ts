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
  "Vuelves a recibir avisos por correo. Telegram queda desconectado y las notificaciones de este móvil siguen apagadas: si los quieres, actívalos aquí mismo.";

/** Bajo el botón de volver: qué aceptas y qué pasa con Telegram (migración 20261018222953). */
export const TEXTO_ACEPTAS_REACTIVAR =
  "Al pulsarlo aceptas de nuevo recibir avisos de carreras en el correo de tu cuenta. Telegram queda desconectado; puedes volver a conectarlo después.";

/** Estando de baja no se ofrecen Telegram ni el push (como Carreras España): primero hay que volver por correo. */
export const TEXTO_CANALES_EN_BAJA =
  "Telegram y las notificaciones en este móvil se pueden activar de nuevo cuando vuelvas a recibir avisos por correo.";
