"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const AppFrame = ({ children }: { children: React.ReactNode }) => {
  const [mobileMenuForPath, setMobileMenuForPath] = useState<string | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMobileMenuOpen = useRef(false);
  const pathname = usePathname();
  const { t } = useTranslation();
  const mobileMenuOpen = !!pathname && mobileMenuForPath === pathname;
  const closeMobileMenu = () => setMobileMenuForPath(null);

  useEffect(() => {
    if (mobileMenuOpen) {
      document
        .querySelector<HTMLButtonElement>("#admin-sidebar button[aria-label]")
        ?.focus();
    } else if (wasMobileMenuOpen.current) {
      mobileMenuButtonRef.current?.focus();
    }
    wasMobileMenuOpen.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMobileMenuForPath(null);
      }
    };

    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuForPath(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="app-page-background flex min-h-screen min-w-0">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onNavigate={closeMobileMenu}
      />

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label={t("menu.closeMenu")}
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 cursor-default bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <header className="app-page-background sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 px-3 sm:px-5 lg:justify-end lg:px-8">
          <button
            ref={mobileMenuButtonRef}
            type="button"
            aria-label={t("menu.openMenu")}
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMobileMenuForPath(pathname)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
