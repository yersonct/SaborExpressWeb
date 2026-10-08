"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/features/auth/hooks/use-auth";

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
