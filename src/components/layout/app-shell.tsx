"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/features/auth/hooks/use-auth";

const ALLOWED_WEB_ROLES = ["GERENTE", "ADMINISTRADOR"];

// Rutas que NO llevan sidebar/campanita (login, etc.)
const PUBLIC_PATHS = ["/login"];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { session, isAuthenticated, isHydrated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

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

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 bg-[#F3F4F6] flex items-center justify-end px-8 shrink-0">
          <NotificationBell />
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};
