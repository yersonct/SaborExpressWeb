"use client";
import "@/config/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROUTES } from "@/config/routes";

export const Sidebar = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { session } = useAuth();

  const ROUTE_INTERNAL: Record<string, string> = {
    [ROUTES.dashboard]: "/dashboard",
    [ROUTES.orders]: "/orders",
    [ROUTES.audit]: "/reports",
    [ROUTES.products]: "/products",
    [ROUTES.employees]: "/employees",
    [ROUTES.branches]: "/branches",
    [ROUTES.config]: "/config",
    [ROUTES.tables]: "/tables",
    [ROUTES.schedules]: "/schedules",
  };

  const isActive = (path: string) =>
    pathname === path || pathname === ROUTE_INTERNAL[path];
  const isGerente = session?.roles.includes("GERENTE");
  const isAdministrador = session?.roles.includes("ADMINISTRADOR");
  const canSeeBranches = isGerente || isAdministrador;
  const canSeeDeliveries = isGerente || isAdministrador;
  const canSeeReviews = isGerente || isAdministrador;

  return (
    <aside className="w-64 bg-gradient-to-br from-[#081A38] via-[#0F2F6B] to-[#163B80] text-white h-screen p-6 flex flex-col fixed left-0 top-0 z-20">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white">
          {t("menu.brand")}
          <span className="text-[#EA1D2C]">{t("menu.suffix")}</span>
        </h2>
        <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-1">
          {t("menu.slogan")}
        </p>
      </div>

      <nav className="flex flex-col gap-3 flex-1">
        <Link
          href={ROUTES.dashboard}
          prefetch={false}
          className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.dashboard) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-[#EA1D2C] text-gray-300 hover:text-white"}`}
        >
          {t("menu.dashboard")}
        </Link>

        <Link
          href={ROUTES.orders}
          prefetch={false}
          className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.orders) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-[#EA1D2C] text-gray-300 hover:text-white"}`}
        >
          {t("menu.orders")}
        </Link>

        <Link
          href={ROUTES.audit}
          prefetch={false}
          className={`p-3 rounded-lg transition-colors flex justify-between items-center ${isActive(ROUTES.audit) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "text-gray-300 hover:bg-[#EA1D2C] hover:text-white"}`}
        >
          {t("menu.audit")}
          <span
            className={`w-2 h-2 rounded-full ${isActive(ROUTES.audit) ? "bg-white" : "bg-red-500 animate-pulse"}`}
          ></span>
        </Link>

        <Link
          href={ROUTES.products}
          prefetch={false}
          className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.products) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-[#EA1D2C] text-gray-300 hover:text-white"}`}
        >
          {t("menu.inventory")}
        </Link>

        <Link
          href={ROUTES.employees}
          prefetch={false}
          className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.employees) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-[#EA1D2C] text-gray-300 hover:text-white"}`}
        >
          {t("menu.staff")}
        </Link>

        {canSeeBranches && (
          <Link
            href={ROUTES.branches}
            prefetch={false}
            className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.branches) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-[#EA1D2C] text-gray-300 hover:text-white"}`}
          >
            {t("menu.branches", "Sedes")}
          </Link>
        )}

        {canSeeDeliveries && (
          <Link
            href={ROUTES.deliveries}
            prefetch={false}
            className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.deliveries) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-[#EA1D2C] text-gray-300 hover:text-white"}`}
          >
            {t("menu.deliveries", "Domicilios")}
          </Link>
        )}

        {canSeeReviews && (
          <Link
            href={ROUTES.reviews}
            prefetch={false}
            className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.reviews) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-[#EA1D2C] text-gray-300 hover:text-white"}`}
          >
            {t("menu.reviews", "Reseñas")}
          </Link>
        )}

        <Link
          href={ROUTES.tables}
          prefetch={false}
          className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.tables) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-[#EA1D2C] text-gray-300 hover:text-white"}`}
        >
          {t("menu.tables", "Mesas")}
        </Link>
        <Link
          href={ROUTES.schedules}
          prefetch={false}
          className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.schedules) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-[#EA1D2C] text-gray-300 hover:text-white"}`}
        >
          {t("menu.schedules", "Turnos")}
        </Link>
      </nav>

      <div className="mt-auto border-t border-gray-800 pt-4 flex flex-col gap-4">
        <LanguageSelector direction="up" />

        <Link
          href={ROUTES.config}
          prefetch={false}
          className={`p-3 rounded-lg transition-colors ${isActive(ROUTES.config) ? "bg-[#EA1D2C] text-white font-bold shadow-md" : "hover:bg-gray-800 text-gray-400 hover:text-white"}`}
        >
          {t("menu.config")}
        </Link>
      </div>
    </aside>
  );
};
  