"use client";

import "@/config/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROUTES } from "@/config/routes";

type SidebarProps = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export const Sidebar = ({ mobileOpen = false, onNavigate }: SidebarProps) => {
  const pathname = usePathname() ?? "";
  const { t } = useTranslation();
  const { session } = useAuth();

  const routeInternal: Record<string, string> = {
    [ROUTES.dashboard]: "/dashboard",
    [ROUTES.orders]: "/orders",
    [ROUTES.audit]: "/reports",
    [ROUTES.products]: "/products",
    [ROUTES.employees]: "/employees",
    [ROUTES.branches]: "/branches",
    [ROUTES.config]: "/config",
    [ROUTES.tables]: "/tables",
    [ROUTES.schedules]: "/schedules",
    [ROUTES.deliveries]: "/deliveries",
    [ROUTES.reviews]: "/reviews",
  };

  const matchesPath = (candidate: string) =>
    pathname === candidate || pathname.startsWith(`${candidate}/`);
  const isActive = (path: string) =>
    [path, routeInternal[path]].some(
      (candidate) => candidate !== undefined && matchesPath(candidate),
    );
  const isGerente = session?.roles.includes("GERENTE");
  const isAdministrador = session?.roles.includes("ADMINISTRADOR");
  const canSeeBranches = isGerente || isAdministrador;
  const canSeeDeliveries = isGerente || isAdministrador;
  const canSeeReviews = isGerente || isAdministrador;
  const linkClass = (active: boolean) =>
    `sidebar-link${active ? " sidebar-link-active" : ""}`;

  return (
    <aside
      id="admin-sidebar"
      data-mobile-open={mobileOpen}
      className={`app-sidebar fixed left-0 top-0 z-50 flex h-screen w-64 max-w-[90vw] flex-col p-6 text-white transition-transform duration-300 lg:z-20 lg:max-w-none lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="mb-6 flex shrink-0 items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("menu.brand")}
            <span className="text-[#EA1D2C]">{t("menu.suffix")}</span>
          </h2>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
            {t("menu.slogan")}
          </p>
        </div>
        <button
          type="button"
          aria-label={t("menu.closeMenu")}
          onClick={onNavigate}
          className="-mr-2 -mt-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <nav
        aria-label={t("menu.navigation")}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            onNavigate?.();
          }
        }}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1"
      >
        <section
          className="flex flex-col gap-1"
          aria-label={t("menu.groupOperations")}
        >
          <p className="sidebar-group-label">{t("menu.groupOperations")}</p>
          <Link
            href={ROUTES.dashboard}
            prefetch={false}
            aria-current={isActive(ROUTES.dashboard) ? "page" : undefined}
            className={linkClass(isActive(ROUTES.dashboard))}
          >
            {t("menu.dashboard")}
          </Link>
          <Link
            href={ROUTES.orders}
            aria-current={isActive(ROUTES.orders) ? "page" : undefined}
            className={linkClass(isActive(ROUTES.orders))}
          >
            {t("menu.orders")}
          </Link>
          <Link
            href={ROUTES.audit}
            prefetch={false}
            aria-current={isActive(ROUTES.audit) ? "page" : undefined}
            className={linkClass(isActive(ROUTES.audit))}
          >
            {t("menu.audit")}
          </Link>
        </section>

        <section
          className="flex flex-col gap-1"
          aria-label={t("menu.groupRestaurant")}
        >
          <p className="sidebar-group-label">{t("menu.groupRestaurant")}</p>
          <Link
            href={ROUTES.products}
            prefetch={false}
            aria-current={isActive(ROUTES.products) ? "page" : undefined}
            className={linkClass(isActive(ROUTES.products))}
          >
            {t("menu.inventory")}
          </Link>
          <Link
            href={ROUTES.employees}
            prefetch={false}
            aria-current={isActive(ROUTES.employees) ? "page" : undefined}
            className={linkClass(isActive(ROUTES.employees))}
          >
            {t("menu.staff")}
          </Link>
          {canSeeBranches && (
            <Link
              href={ROUTES.branches}
              prefetch={false}
              aria-current={isActive(ROUTES.branches) ? "page" : undefined}
              className={linkClass(isActive(ROUTES.branches))}
            >
              {t("menu.branches")}
            </Link>
          )}
          {canSeeDeliveries && (
            <Link
              href={ROUTES.deliveries}
              prefetch={false}
              aria-current={isActive(ROUTES.deliveries) ? "page" : undefined}
              className={linkClass(isActive(ROUTES.deliveries))}
            >
              {t("menu.deliveries")}
            </Link>
          )}
          {canSeeReviews && (
            <Link
              href={ROUTES.reviews}
              prefetch={false}
              aria-current={isActive(ROUTES.reviews) ? "page" : undefined}
              className={linkClass(isActive(ROUTES.reviews))}
            >
              {t("menu.reviews")}
            </Link>
          )}
          <Link
            href={ROUTES.tables}
            prefetch={false}
            aria-current={isActive(ROUTES.tables) ? "page" : undefined}
            className={linkClass(isActive(ROUTES.tables))}
          >
            {t("menu.tables")}
          </Link>
          <Link
            href={ROUTES.schedules}
            prefetch={false}
            aria-current={isActive(ROUTES.schedules) ? "page" : undefined}
            className={linkClass(isActive(ROUTES.schedules))}
          >
            {t("menu.schedules")}
          </Link>
        </section>
      </nav>

      <div className="mt-4 border-t border-white/15 pt-4 flex flex-col gap-3 shrink-0">
        <LanguageSelector direction="up" />
        <Link
          href={ROUTES.config}
          prefetch={false}
          aria-current={isActive(ROUTES.config) ? "page" : undefined}
          onClick={onNavigate}
          className={linkClass(isActive(ROUTES.config))}
        >
          {t("menu.config")}
        </Link>
      </div>
    </aside>
  );
};
