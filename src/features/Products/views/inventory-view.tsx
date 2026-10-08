"use client";

import { useState } from "react";
import { ProductsView } from "./products-view";
import { CategoriesView } from "../../Categories/views/categories-view";
import { DailyMenuView } from "../../DailyMenu/views/daily-menu-view";
import { useAuth } from "@/features/auth/hooks/use-auth";

type Tab = "productos" | "categorias" | "menu";

export const InventoryView = () => {
  const [activeTab, setActiveTab] = useState<Tab>("productos");
  const { session } = useAuth();
  const isAdministrador = session?.roles.includes("ADMINISTRADOR");

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              Cartelera de Productos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestiona el menú digital, precios y disponibilidad de
              SaborExpress.
            </p>
          </div>
        </div>

        {/* PESTAÑAS — "Categorías" solo para Gerente. "Menú del Día" para ambos roles. */}
        <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("productos")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === "productos"
                ? "bg-[#111827] text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Productos
          </button>

          {!isAdministrador && (
            <button
              onClick={() => setActiveTab("categorias")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === "categorias"
                  ? "bg-[#111827] text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Categorías
            </button>
          )}

          <button
            onClick={() => setActiveTab("menu")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === "menu"
                ? "bg-[#111827] text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Menú del Día
          </button>
        </div>

        {activeTab === "productos" && <ProductsView />}
        {activeTab === "categorias" && !isAdministrador && <CategoriesView />}
        {activeTab === "menu" && <DailyMenuView />}
      </div>
    </>
  );
};
