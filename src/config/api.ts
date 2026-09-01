import axios from "axios";

const SESSION_KEY = "sabor-express-session";

export const http = axios.create({
  // baseURL: "http://localhost:5050/api",
  baseURL: "https://3g350dl1-5050.use2.devtunnels.ms/api",
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
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
    "Tu sesión se inició en otro dispositivo o pantalla. Redirigiendo al login...";
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

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const isLoginAttempt = error.config?.url?.includes("/Auth/login");

      if (!isLoginAttempt && !redirecting) {
        redirecting = true;
        localStorage.removeItem(SESSION_KEY);
        showSessionExpiredToast();

        setTimeout(() => {
          window.location.href = "/login";
        }, 2500); // 👈 tiempo para leer el aviso antes de redirigir
      }
    }
    return Promise.reject(error);
  },
);
  