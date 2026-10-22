"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { UserSession } from "../types/auth.types";
import { authService } from "../services/auth.service";
import { setInMemorySession } from "../session-memory";

interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (session: UserSession) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const authVersion = useRef(0);

  useEffect(() => {
    let active = true;
    const bootstrapVersion = authVersion.current;
    const handleOffline = () => {
      authVersion.current += 1;
      setInMemorySession(null);
      setSession(null);
      setIsHydrated(true);
    };

    window.addEventListener("offline", handleOffline);
    try {
      // Retira la sesión antigua que guardaba el JWT en almacenamiento accesible a JavaScript.
      localStorage.removeItem("sabor-express-session");
    } catch {
      // El almacenamiento del navegador puede estar deshabilitado.
    }

const isLoginPage =
  window.location.pathname === "/login" ||
  window.location.pathname.startsWith("/login/");

if (isLoginPage) {
  setIsHydrated(true);
} else if (navigator.onLine === false) {
  handleOffline();
} else {
  void authService
    .getCurrentSession()
    .then((restoredSession) => {
      if (!active || authVersion.current !== bootstrapVersion) return;
      setInMemorySession(restoredSession);
      setSession(restoredSession);
    })
    .catch(() => {
      if (!active || authVersion.current !== bootstrapVersion) return;
      setInMemorySession(null);
      setSession(null);
    })
    .finally(() => {
      if (active) setIsHydrated(true);
    });
}

    const handleSessionRefreshed = (event: Event) => {
      const refreshed = (event as CustomEvent<UserSession>).detail;
      if (!refreshed || navigator.onLine === false) return;
      authVersion.current += 1;
      setInMemorySession(refreshed);
      setSession(refreshed);
    };
    const handleSessionExpired = () => {
      authVersion.current += 1;
      setInMemorySession(null);
      setSession(null);
    };
    window.addEventListener("sabor-express:session-refreshed", handleSessionRefreshed);
    window.addEventListener("sabor-express:auth-expired", handleSessionExpired);
    return () => {
      active = false;
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("sabor-express:session-refreshed", handleSessionRefreshed);
      window.removeEventListener("sabor-express:auth-expired", handleSessionExpired);
    };
  }, []);

  const login = useCallback((newSession: UserSession) => {
    if (navigator.onLine === false) {
      throw new Error("El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.");
    }
    authVersion.current += 1;
    setInMemorySession(newSession);
    setSession(newSession);
  }, []);

const logout = useCallback(async () => {
  authVersion.current += 1;
  setInMemorySession(null);
  setSession(null);
  await authService.logout();
}, []);

  return (
    <AuthContext.Provider
      value={{ session, isAuthenticated: !!session, isHydrated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
