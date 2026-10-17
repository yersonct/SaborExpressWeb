"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useForceLogout } from "@/features/auth/hooks/use-force-logout";
import { AppFrame } from "./app-frame";

const ALLOWED_WEB_ROLES = ["GERENTE", "ADMINISTRADOR"];

// Rutas que NO llevan sidebar/campanita (login, etc.)
const PUBLIC_PATHS = ["/login", "/letter"];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { session, isAuthenticated, isHydrated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useForceLogout();

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  useEffect(() => {
    if (!isHydrated || isPublicPath) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const tieneAccesoWeb = session?.roles.some((r) =>
      ALLOWED_WEB_ROLES.includes(r),
    );

    if (!tieneAccesoWeb) {
      logout();
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, session, logout, router, isPublicPath]);

  // Login y páginas públicas: sin sidebar, tal cual vienen
  if (isPublicPath) {
    return <>{children}</>;
  }

  const tieneAccesoWeb = session?.roles.some((r) =>
    ALLOWED_WEB_ROLES.includes(r),
  );

  if (!isHydrated || !isAuthenticated || !tieneAccesoWeb) {
    return null;
  }

  return <AppFrame>{children}</AppFrame>;
};
