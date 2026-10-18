export const ONESIGNAL_APP_ID = "12796c96-a5cd-4db3-af58-584c429ce188";

/**
 * Identificador del administrador para los avisos internos de un alta.
 * No se usa para vincular navegadores anónimos. Con sesión, el external_id
 * es el user_id (ver `vincularPushAUsuario`).
 */
const IDENTIFICADOR_EXTERNO_POR_DEFECTO = "60040074-3197-4584-855c-82f40ee8770e";

export const ONESIGNAL_EXTERNAL_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_EXTERNAL_ID?.trim() || IDENTIFICADOR_EXTERNO_POR_DEFECTO;

/** Misma persona que el aviso público. La página interna de prueba reutiliza este valor. */
export const VIP_TEST_EXTERNAL_ID = ONESIGNAL_EXTERNAL_ID;

const AVISOS_CLAVE = "ca-avisos-activados";
export const AVISOS_EVENTO = "ca-avisos";

/** Preferred Site URL host. Apex also works if OneSignal Site URL matches. */
export const ONESIGNAL_PREFERRED_ORIGIN = "https://www.carrerasasturias.es";
export const VIP_PUSH_TEST_PATH = "/interno/vip-push";
export const VIP_PUSH_TEST_PREFERRED_URL = `${ONESIGNAL_PREFERRED_ORIGIN}${VIP_PUSH_TEST_PATH}`;

export const ONESIGNAL_SDK_SRC =
  "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

export type OneSignalWebSDK = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout?: () => Promise<void>;
  Notifications: {
    requestPermission: () => boolean | Promise<boolean | void>;
    isPushSupported: () => boolean;
    permission: boolean;
  };
  User: {
    addTag: (key: string, value: string) => void | Promise<void>;
    PushSubscription?: {
      optedIn?: boolean;
      optIn?: () => Promise<void>;
      optOut?: () => Promise<void>;
    };
  };
};

type OneSignalCallback = (onesignal: OneSignalWebSDK) => void | Promise<void>;

declare global {
  interface Window {
    OneSignalDeferred?: OneSignalCallback[];
    OneSignal?: OneSignalWebSDK;
  }
}

let sdkLoad: Promise<void> | null = null;
let initPromise: Promise<OneSignalWebSDK> | null = null;

function ensureDeferredQueue(): OneSignalCallback[] {
  if (!window.OneSignalDeferred) {
    window.OneSignalDeferred = [];
  }
  return window.OneSignalDeferred;
}

export function loadOneSignalSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OneSignal solo funciona en el navegador."));
  }

  if (window.OneSignal) return Promise.resolve();
  if (sdkLoad) return sdkLoad;

  ensureDeferredQueue();

  sdkLoad = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-onesignal-sdk="v16"]',
    );
    if (existing) {
      if (window.OneSignal) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar el SDK de OneSignal.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = ONESIGNAL_SDK_SRC;
    script.defer = true;
    script.dataset.onesignalSdk = "v16";
    script.onload = () => resolve();
    script.onerror = () => {
      sdkLoad = null;
      reject(new Error("No se pudo cargar el SDK de OneSignal."));
    };
    document.head.appendChild(script);
  });

  return sdkLoad;
}

function withOneSignal<T>(fn: (onesignal: OneSignalWebSDK) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const queue = ensureDeferredQueue();
    queue.push(async (onesignal) => {
      try {
        resolve(await fn(onesignal));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function initOneSignal(): Promise<OneSignalWebSDK> {
  await loadOneSignalSdk();

  if (initPromise) return initPromise;

  initPromise = withOneSignal(async (onesignal) => {
    await onesignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/" },
      allowLocalhostAsSecureOrigin: true,
      welcomeNotification: { disable: true },
      notifyButton: { enable: false },
    });
    return onesignal;
  }).catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

export function permissionDeniedMessage(): string {
  return "El navegador ha bloqueado las notificaciones. Actívalas en la configuración del sitio e inténtalo de nuevo.";
}

export function pushUnsupportedMessage(): string {
  return "Este navegador o contexto no admite notificaciones push (haz la prueba en HTTPS, fuera de modo privado).";
}

export function toErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message.trim()
      : typeof error === "string"
        ? error.trim()
        : "";
  const lower = raw.toLowerCase();

  if (lower.includes("can only be used on")) {
    return `OneSignal no admite este origen. Abre ${VIP_PUSH_TEST_PREFERRED_URL} (HTTPS; www o apex según la Site URL) e inténtalo de nuevo.`;
  }
  if (lower.includes("not configured for web push")) {
    return `OneSignal no tiene web push para este origen. Haz la prueba en ${VIP_PUSH_TEST_PREFERRED_URL} (HTTPS; www o apex según la Site URL, no modo privado).`;
  }
  if (lower.includes("the app id is not valid") || lower.includes("invalid app id")) {
    return "El App ID de OneSignal no es válido.";
  }

  return raw || "No se pudo activar el push VIP de prueba.";
}

export function avisosActivadosLocalmente(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return false;
  }
  try {
    return window.localStorage.getItem(AVISOS_CLAVE) === AVISOS_LOCAL;
  } catch {
    return false;
  }
}

const AVISOS_LOCAL = "local";

function marcarAvisosActivados(): void {
  try {
    window.localStorage.setItem(AVISOS_CLAVE, AVISOS_LOCAL);
  } catch {
    // El permiso queda en el navegador aunque no se pueda recordar la preferencia.
  }
  window.dispatchEvent(new Event(AVISOS_EVENTO));
}

async function permisoConcedido(onesignal: OneSignalWebSDK): Promise<boolean> {
  const requested = await onesignal.Notifications.requestPermission();
  if (requested === true || onesignal.Notifications.permission) return true;
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    return true;
  }
  return false;
}

async function asegurarPermisoPush(): Promise<OneSignalWebSDK> {
  const onesignal = await initOneSignal();

  if (!onesignal.Notifications.isPushSupported()) {
    throw new Error(
      "Este navegador no admite avisos. Prueba en Chrome o en el navegador del móvil, fuera del modo privado.",
    );
  }

  if (typeof Notification !== "undefined" && Notification.permission === "denied") {
    throw new Error(permissionDeniedMessage());
  }

  const concedido = await permisoConcedido(onesignal);
  if (!concedido) {
    throw new Error(permissionDeniedMessage());
  }

  const suscripcion = onesignal.User.PushSubscription;
  if (suscripcion && suscripcion.optedIn === false && suscripcion.optIn) {
    await suscripcion.optIn();
  }

  return onesignal;
}

/** Pide permiso en el gesto del formulario, sin vincular todavía el external_id. */
export async function prepararPushRegistro(): Promise<void> {
  await asegurarPermisoPush();
}

/** Vincula la suscripción de este navegador al user_id de Supabase Auth. */
export async function vincularPushAUsuario(userId: string): Promise<void> {
  const id = userId.trim();
  if (!id) throw new Error("Falta el usuario para vincular el aviso.");
  const onesignal = await initOneSignal();
  await onesignal.login(id);
}

/**
 * Quita el aviso de este navegador: baja la suscripción push y desvincula el user_id
 * (external_id) en OneSignal. Si el SDK no carga, no falla: el envío ya se corta con push_activado=false.
 */
export async function desvincularPush(): Promise<void> {
  try {
    const onesignal = await initOneSignal();
    await onesignal.User.PushSubscription?.optOut?.();
    await onesignal.logout?.();
  } catch {
    // sin SDK o sin permiso: no hay nada que desvincular en este navegador
  }
}

/**
 * Pide el permiso en este navegador. No llama a login(): sin sesión no hay
 * external_id, y nunca el identificador fijo del administrador.
 */
export async function activarAvisos(): Promise<void> {
  await asegurarPermisoPush();
  marcarAvisosActivados();
}

export function mensajeErrorAvisos(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message.trim()
      : typeof error === "string"
        ? error.trim()
        : "";

  if (raw === permissionDeniedMessage() || raw.startsWith("Este navegador no admite avisos")) {
    return raw;
  }

  const lower = raw.toLowerCase();
  if (lower.includes("can only be used on") || lower.includes("not configured for web push")) {
    return "Este sitio no está autorizado para avisos. En OneSignal, el dominio permitido tiene que ser el de esta web.";
  }
  if (lower.includes("the app id is not valid") || lower.includes("invalid app id")) {
    return "No se han podido activar los avisos: la aplicación no es válida.";
  }

  return "No se han podido activar los avisos. Inténtalo de nuevo.";
}
