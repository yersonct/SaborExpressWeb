import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  isPreferenceLanguage,
  preferenceStorageKey,
  readPreferenceUserId,
} from "@/config/user-preferences";
import i18n from "@/config/i18n";
import { translateCopy } from "@/config/copy-translations";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const SESSION_KEY = "sabor-express-session";
export const SERVER_BASE_URL = API_BASE;
export const http = axios.create({
  baseURL: `${API_BASE}/api`,
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

function localizeApiError(error: any) {
  const data = error?.response?.data;
  if (!data || typeof data !== "object") {
    if (error?.response) {
      error.message = translateCopy("No se pudo completar la solicitud.");
    }
    return;
  }

  for (const field of ["error", "message", "detail"]) {
    if (typeof data[field] === "string") {
      data[field] = translateCopy(data[field]);
    }
  }

  if (data.errors && typeof data.errors === "object") {
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

function readSession() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveSession(session: any) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

http.interceptors.request.use((config) => {
  setLanguageHeader(config);
  config.headers.set("X-Client-App", "admin-web");
  if (typeof window !== "undefined") {
    const session = readSession();
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  }
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
    font-family: Arial, Helvetica, sans-serif;
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
    font-family: Arial, Helvetica, sans-serif;
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
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((s) => s.resolve(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach((s) => s.reject(err));
  refreshSubscribers = [];
}

function forceLogout() {
  if (redirecting) return;
  redirecting = true;
  localStorage.removeItem(SESSION_KEY);
  showSessionExpiredToast();
  setTimeout(() => {
    window.location.href = "/login";
  }, 2500);
}

function serviceUnavailableLogout() {
  if (redirecting) return;
  redirecting = true;
  localStorage.removeItem(SESSION_KEY);
  showSessionExpiredToast(
    translateCopy("El servicio no está disponible en este momento. Redirigiendo al login..."),
  );
  setTimeout(() => {
    window.location.href = "/login";
  }, 2500);
}

function hasStoredWebSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return Boolean(raw && JSON.parse(raw)?.token);
  } catch {
    return false;
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
    navigator.onLine === false ||
    redirecting
  ) return;

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
    const isRefreshAttempt = originalRequest?.url?.includes(
      "/Auth/refresh-token",
    );

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

    const session = readSession();
    if (!session?.refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolamos esta petición
    // hasta que termine, en vez de disparar refresh-token varias veces a la vez.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push({
          resolve: (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(http(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${http.defaults.baseURL}/Auth/refresh-token`,
        { refreshToken: session.refreshToken },
        { headers: { "Accept-Language": getPreferredLanguage() } },
      );

      const newSession = {
        ...session,
        userId: data.userId ?? session.userId,
        identifier: data.identifier,
        roles: data.roles,
        token: data.token,
        refreshToken: data.refreshToken,
      };
      saveSession(newSession);

      isRefreshing = false;
      onTokenRefreshed(data.token);

      originalRequest.headers.Authorization = `Bearer ${data.token}`;
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
