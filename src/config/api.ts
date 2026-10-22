import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  isPreferenceLanguage,
  preferenceStorageKey,
  readPreferenceUserId,
} from "@/config/user-preferences";
import i18n from "@/config/i18n";
import { translateCopy } from "@/config/copy-translations";
import { getInMemorySession, setInMemorySession } from "@/features/auth/session-memory";
import type { UserSession } from "@/features/auth/types/auth.types";

const CONFIGURED_API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

function isLocalDevelopmentHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized.endsWith(".localhost") || normalized.endsWith(".local")) {
    return true;
  }

  const octets = normalized.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  return octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168);
}

function resolveApiBase(): string | undefined {
  if (!CONFIGURED_API_BASE || typeof window === "undefined" || process.env.NODE_ENV !== "development") {
    return CONFIGURED_API_BASE;
  }

  try {
    const configured = new URL(CONFIGURED_API_BASE);
    const current = new URL(window.location.href);
    if (
      configured.protocol !== current.protocol ||
      !isLocalDevelopmentHost(configured.hostname) ||
      !isLocalDevelopmentHost(current.hostname)
    ) {
      return CONFIGURED_API_BASE;
    }

    configured.hostname = current.hostname;
    return configured.origin + configured.pathname.replace(/\/+$/, "");
  } catch {
    return CONFIGURED_API_BASE;
  }
}

const API_BASE = resolveApiBase();

export const SERVER_BASE_URL = API_BASE;
export const http = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function getPreferredLanguage() {
  let language = i18n.resolvedLanguage ?? i18n.language ?? "es";
  if (typeof window !== "undefined") {
    try {
      language =
        localStorage.getItem(
          preferenceStorageKey("language", readPreferenceUserId()),
        ) ?? language;
    } catch {
      // Keep the active i18next language when local storage is unavailable.
    }
  }

  const code = language.toLowerCase().split(/[-_]/)[0];
  return isPreferenceLanguage(code) ? code : "es";
}

function setLanguageHeader(config: InternalAxiosRequestConfig) {
  config.headers.set("Accept-Language", getPreferredLanguage());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function localizeApiError(error: unknown) {
  if (!axios.isAxiosError(error)) return;
  const data = error.response?.data;
  if (!isRecord(data)) {
    if (error.response) error.message = translateCopy("No se pudo completar la solicitud.");
    return;
  }

  for (const field of ["error", "message", "detail"]) {
    if (typeof data[field] === "string") {
      data[field] = translateCopy(data[field]);
    }
  }

  if (isRecord(data.errors)) {
    for (const [key, value] of Object.entries(data.errors)) {
      if (typeof value === "string") data.errors[key] = translateCopy(value);
      else if (Array.isArray(value)) {
        data.errors[key] = value.map((item) =>
          typeof item === "string" ? translateCopy(item) : item,
        );
      }
    }
  }

  const backendMessage = data.error ?? data.message ?? data.detail;
  error.message = typeof backendMessage === "string"
    ? translateCopy(backendMessage)
    : translateCopy("No se pudo completar la solicitud.");
}

http.interceptors.request.use((config) => {
  setLanguageHeader(config);
  config.headers.set("X-Client-App", "admin-web");
  return config;
});

// Muestra un aviso breve en pantalla antes de redirigir al login.
// Vive fuera de React (el interceptor no tiene acceso a hooks/contexto),
// así que se construye con DOM plano.
function showSessionExpiredToast(
  message = translateCopy("Tu sesión expiró o se inició en otro dispositivo. Redirigiendo al login..."),
) {
  if (document.getElementById("session-expired-toast")) return; // evita duplicados

  const toast = document.createElement("div");
  toast.id = "session-expired-toast";
  toast.dataset.copySource = message;
  toast.textContent = translateCopy(message);
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #111827;
    color: #ffffff;
    padding: 14px 24px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    z-index: 999999;
    border-left: 4px solid #EA1D2C;
  `;
  document.body.appendChild(toast);
}

const networkMessages: Record<string, string> = {
  es: "Sin conexión con el servidor. Revisa tu señal e inténtalo de nuevo.",
  en: "No connection to the server. Check your connection and try again.",
  pt: "Sem conexão com o servidor. Verifique sua conexão e tente novamente.",
  fr: "Aucune connexion au serveur. Vérifiez votre connexion et réessayez.",
};

function getNetworkErrorMessage() {
  let language = "es";
  try {
    language =
      localStorage.getItem(
        preferenceStorageKey("language", readPreferenceUserId()),
      ) ?? "es";
  } catch {
    // Storage may be unavailable in private browsing; use Spanish as fallback.
  }
  return networkMessages[language] ?? networkMessages.es;
}

function showNetworkErrorToast(message = getNetworkErrorMessage()) {
  if (typeof document === "undefined") return;
  let toast = document.getElementById("network-error-toast");
  if (toast) {
    const text = toast.querySelector("[data-network-error-message]");
    if (text) text.textContent = message;
    return;
  }

  toast = document.createElement("div");
  toast.id = "network-error-toast";
  toast.setAttribute("role", "alert");
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: calc(100vw - 32px);
    background: #991b1b;
    color: #ffffff;
    padding: 14px 18px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    z-index: 999998;
  `;

  const text = document.createElement("span");
  text.dataset.networkErrorMessage = "true";
  text.textContent = message;
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "×";
  close.setAttribute("aria-label", translateCopy("Cerrar aviso de conexión"));
  close.style.cssText = "color: white; background: transparent; border: 0; font-size: 20px; cursor: pointer;";
  close.addEventListener("click", () => toast?.remove());
  toast.append(text, close);
  document.body.appendChild(toast);
}

function clearNetworkErrorToast() {
  if (typeof document !== "undefined") {
    document.getElementById("network-error-toast")?.remove();
  }
}

i18n.on("languageChanged", () => {
  if (typeof document === "undefined") return;

  const networkMessage = document.querySelector<HTMLElement>(
    "#network-error-toast [data-network-error-message]",
  );
  if (networkMessage) networkMessage.textContent = getNetworkErrorMessage();

  const sessionToast = document.getElementById("session-expired-toast");
  const copySource = sessionToast?.dataset.copySource;
  if (sessionToast && copySource) {
    sessionToast.textContent = translateCopy(copySource);
  }
});

export function reportNetworkAvailable() {
  clearNetworkErrorToast();
}

export function reportNetworkUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object" || axios.isCancel(error)) return false;

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    response?: unknown;
  };
  const description = String(candidate.message ?? "").toLowerCase();
  const networkFailure =
    candidate.code === "ERR_NETWORK" ||
    /network error|failed to fetch|fetch failed|network request failed|unknownhostexception|unable to resolve host|no address associated with hostname|econnrefused|ehostunreach|network is unreachable|err_internet_disconnected|socket hang up/.test(
      description,
    );
  if (!networkFailure) return false;

  const message = getNetworkErrorMessage();
  try {
    (error as { message?: string }).message = message;
  } catch {
    // The original error can be read-only; the global notice still reports it.
  }
  showNetworkErrorToast(message);
  void verifyBackendOrLogout();
  return true;
}

let redirecting = false;
let backendHealthProbe: Promise<boolean> | null = null;

// --- Lógica de refresh automático ---
let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

function onTokenRefreshed() {
  refreshSubscribers.forEach((subscriber) => subscriber.resolve());
  refreshSubscribers = [];
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach((s) => s.reject(err));
  refreshSubscribers = [];
}

function forceLogout() {
  clearInMemorySession();

  // Si ya estamos en el login, no mostrar avisos
  // ni intentar redirigir nuevamente.
  if (
    window.location.pathname === "/login" ||
    window.location.pathname.startsWith("/login/")
  ) {
    return;
  }

  if (redirecting) return;

  redirecting = true;
  showSessionExpiredToast();

  setTimeout(() => {
    window.location.replace(
      new URL("/login", window.location.origin)
    );
  }, 2500);
}

function serviceUnavailableLogout() {
  clearInMemorySession();
  if (redirecting) return;
  redirecting = true;
  showSessionExpiredToast(
    translateCopy("El servicio no está disponible en este momento. Redirigiendo al login..."),
  );
  setTimeout(() => {
    window.location.replace(new URL("/login", window.location.origin));
  }, 2500);
}

function hasStoredWebSession() {
  return getInMemorySession() !== null;
}

function clearInMemorySession() {
  setInMemorySession(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sabor-express:auth-expired"));
  }
}

function getBackendHealthUrl() {
  if (!API_BASE) return "/health";
  try {
    // API_BASE suele terminar en /api, mientras que /health vive en la raíz.
    return new URL("/health", API_BASE).toString();
  } catch {
    return "/health";
  }
}

async function verifyBackendOrLogout() {
  if (
    typeof window === "undefined" ||
    window.location.pathname.startsWith("/login") ||
    !hasStoredWebSession() ||
    redirecting
  ) return;

  if (navigator.onLine === false) {
    serviceUnavailableLogout();
    return;
  }

  const probe = backendHealthProbe ?? (backendHealthProbe = axios
    .get(getBackendHealthUrl(), { timeout: 4000 })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      backendHealthProbe = null;
    }));

  const isAvailable = await probe;
  if (!isAvailable && hasStoredWebSession()) serviceUnavailableLogout();
}

http.interceptors.response.use(
  (response) => {
    clearNetworkErrorToast();
    return response;
  },
  async (error) => {
    // Reescribe error.message con el mensaje real que manda el backend
    // (ej. "Ya existe una mesa con ese número en esta sucursal"), para que
    // cualquier `catch` en cualquier hook lo reciba correcto automáticamente,
    // en vez del genérico "Request failed with status code 400" de Axios.
    localizeApiError(error);

    if (reportNetworkUnavailable(error)) {
      // Conserva la sesión si /health confirma que el backend sigue disponible.
      return Promise.reject(error);
    }

    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const serviceDown =
      !axios.isCancel(error) &&
      (status === 502 || status === 503 || status === 504);

    if (serviceDown) {
      if (window.location.pathname.startsWith("/login")) {
        // Ya está en el login: solo mostramos el mensaje en el formulario
        error.message =
          translateCopy("El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.");
      } else {
        serviceUnavailableLogout();
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const isLoginAttempt = originalRequest?.url?.includes("/Auth/login");
    const isRefreshAttempt = originalRequest?.url?.includes("/Auth/web-refresh-token");

    if (error?.response?.status !== 401 || isLoginAttempt || isRefreshAttempt) {
      // Si el propio refresh-token falló (refresh token vencido/inválido),
      // no hay nada más que hacer: cerramos sesión.
      if (error?.response?.status === 401 && isRefreshAttempt) {
        forceLogout();
      }
      return Promise.reject(error);
    }

    // Evita reintentar infinitamente la misma petición
    if (originalRequest._retry) {
      forceLogout();
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // Si ya hay un refresh en curso, encolamos esta petición
    // hasta que termine, en vez de disparar refresh-token varias veces a la vez.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push({
          resolve: () => resolve(http(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post<UserSession>(
        `${http.defaults.baseURL}/Auth/web-refresh-token`,
        {},
        {
          withCredentials: true,
          headers: {
            "X-Client-App": "admin-web",
            "Accept-Language": getPreferredLanguage(),
          },
        },
      );
      const refreshedSession: UserSession = {
        userId: data.userId,
        identifier: data.identifier,
        roles: data.roles,
        employeeId: data.employeeId ?? null,
      };
      setInMemorySession(refreshedSession);
      window.dispatchEvent(new CustomEvent("sabor-express:session-refreshed", {
        detail: refreshedSession,
      }));

      isRefreshing = false;
      onTokenRefreshed();

      return http(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      onRefreshFailed(refreshError);
      if (!reportNetworkUnavailable(refreshError)) forceLogout();
      return Promise.reject(refreshError);
    }
  },
);
export const publicHttp = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

publicHttp.interceptors.request.use((config) => {
  setLanguageHeader(config);
  return config;
});

publicHttp.interceptors.response.use(
  (response) => {
    clearNetworkErrorToast();
    return response;
  },
  (error) => {
    localizeApiError(error);
    reportNetworkUnavailable(error);
    return Promise.reject(error);
  },
);
