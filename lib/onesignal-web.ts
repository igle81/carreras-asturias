export const ONESIGNAL_APP_ID = "12796c96-a5cd-4db3-af58-584c429ce188";

/** vip_subscribers.id for Javier — internal test only. */
export const VIP_TEST_EXTERNAL_ID = "60040074-3197-4584-855c-82f40ee8770e";

/** Preferred Site URL host. Apex also works if OneSignal Site URL matches. */
export const ONESIGNAL_PREFERRED_ORIGIN = "https://www.carrerasasturias.es";
export const VIP_PUSH_TEST_PATH = "/interno/vip-push";
export const VIP_PUSH_TEST_PREFERRED_URL = `${ONESIGNAL_PREFERRED_ORIGIN}${VIP_PUSH_TEST_PATH}`;

export const ONESIGNAL_SDK_SRC =
  "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

export type OneSignalWebSDK = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  Notifications: {
    requestPermission: () => boolean | Promise<boolean | void>;
    isPushSupported: () => boolean;
    permission: boolean;
  };
  User: {
    addTag: (key: string, value: string) => void | Promise<void>;
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
      serviceWorkerPath: "OneSignalSDKWorker.js",
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
