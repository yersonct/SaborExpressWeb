"use client";

import { Sidebar } from "./sidebar";
import { useIdleLogout } from "@/features/auth/hooks/use-idle-logout";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  useIdleLogout();

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">{children}</main>
    </div>
  );
};
