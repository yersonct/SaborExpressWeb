"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AppFrame } from "./app-frame";

const ALLOWED_WEB_ROLES = ["GERENTE", "ADMINISTRADOR"];

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { session, isAuthenticated, isHydrated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const tieneAccesoWeb = session?.roles.some((r) =>
      ALLOWED_WEB_ROLES.includes(r),
    );

    if (!tieneAccesoWeb) {
      // Sesión válida, pero de un rol que no pertenece al panel web
      // (ej. Cliente, Mesero, Cajero... esos usan la app móvil).
      logout();
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, session, logout, router]);

  const tieneAccesoWeb = session?.roles.some((r) =>
    ALLOWED_WEB_ROLES.includes(r),
  );

  if (!isHydrated || !isAuthenticated || !tieneAccesoWeb) {
    return null;
  }

  return <AppFrame>{children}</AppFrame>;
};
