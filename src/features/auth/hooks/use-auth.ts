"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserSession } from "../types/auth.types";

const SESSION_KEY = "sabor-express-session";

function readSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as UserSession) : null;
}

export function useAuth() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false); 

  useEffect(() => {
    setSession(readSession());
    setIsHydrated(true); 
  }, []);

  const login = useCallback((newSession: UserSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  return {
    session,
    isAuthenticated: !!session,
    isHydrated, 
    login,
    logout,
  };
}
