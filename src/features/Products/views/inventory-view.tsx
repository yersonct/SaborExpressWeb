"use client";

import { translateCopy } from "@/config/copy-translations";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProductsView } from "./products-view";
import { CategoriesView } from "../../Categories/views/categories-view";

type Tab = "productos" | "categorias";

export const InventoryView = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("productos");

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              {t("pageTitles.inventory")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {translateCopy("Gestiona productos, categorías, precios y disponibilidad de SaborExpress.")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("productos")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === "productos"
                ? "bg-[#111827] text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {translateCopy("Productos")}
          </button>

            <button
              onClick={() => setActiveTab("categorias")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === "categorias"
                  ? "bg-[#111827] text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {translateCopy("Categorías")}
            </button>
        </div>

        {activeTab === "productos" && <ProductsView />}
        {activeTab === "categorias" && <CategoriesView />}
      </div>
    </>
  );
};
