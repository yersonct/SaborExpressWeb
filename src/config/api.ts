import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const SESSION_KEY = "sabor-express-session";
export const SERVER_BASE_URL = API_BASE;
export const http = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

function readSession() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveSession(session: any) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

http.interceptors.request.use((config) => {
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
function showSessionExpiredToast() {
  if (document.getElementById("session-expired-toast")) return; // evita duplicados

  const toast = document.createElement("div");
  toast.id = "session-expired-toast";
  toast.textContent =
    "Tu sesión expiró o se inició en otro dispositivo. Redirigiendo al login...";
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

let redirecting = false;

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

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Reescribe error.message con el mensaje real que manda el backend
    // (ej. "Ya existe una mesa con ese número en esta sucursal"), para que
    // cualquier `catch` en cualquier hook lo reciba correcto automáticamente,
    // en vez del genérico "Request failed with status code 400" de Axios.
    const backendMessage =
      error?.response?.data?.error ?? error?.response?.data?.message;
    if (backendMessage) {
      error.message = backendMessage;
    }

    if (typeof window === "undefined") {
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
      forceLogout();
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