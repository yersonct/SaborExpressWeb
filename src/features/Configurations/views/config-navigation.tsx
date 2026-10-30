"use client";

import { translateCopy } from "@/config/copy-translations";

import type { ConfigModel } from "./config-model";
export function ConfigNavigation({ model }: { model: ConfigModel }) {
  const { activeTab, setActiveTab, t, handleLogout } = model;
  return (<>
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("perfil")}
                aria-current={activeTab === "perfil" ? "page" : undefined}
                className={`config-section-tab${activeTab === "perfil" ? " config-section-tab-active" : ""}`}
              >
                {t("configuration.profile")}
              </button>
              <button
                onClick={() => setActiveTab("negocio")}
                aria-current={activeTab === "negocio" ? "page" : undefined}
                className={`config-section-tab${activeTab === "negocio" ? " config-section-tab-active" : ""}`}
              >
                {t("configuration.restaurant")}
              </button>
              <button
                onClick={() => setActiveTab("carta")}
                aria-current={activeTab === "carta" ? "page" : undefined}
                className={`config-section-tab${activeTab === "carta" ? " config-section-tab-active" : ""}`}
              >
                {t("configuration.menu")}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-left text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                {translateCopy("Cerrar Sesión")}
              </button>
            </nav>
          </div>
  </>);
}
