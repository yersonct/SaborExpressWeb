"use client";

import React, { useEffect, useState } from "react";
import { productPublicService } from "@/features/Products/services/product.public.service";
import { categoryPublicService } from "@/features/Categories/services/category.public.service";
import { SERVER_BASE_URL } from "@/config/api";
import type { Product } from "@/features/Products/types/product.types";

interface CategoryGroup {
  title: string;
  items: Product[];
}

export default function CartaDigital() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function loadMenu() {
      try {
        // La sede viene en la URL: /letter?branchId=3
        const raw = new URLSearchParams(window.location.search).get("branchId");
        const branchId = raw && !isNaN(Number(raw)) ? Number(raw) : undefined;

        const [products, cats] = await Promise.all([
          productPublicService.getAll(branchId),
          categoryPublicService.getAll(),
        ]);

        // Solo las categorías con status = true pueden mostrar productos
        const activeCategoryIds = new Set(
          cats.filter((c) => c.status).map((c) => c.id),
        );

        // Un producto se muestra SOLO si él está activo Y su categoría está activa
        const activeProducts = products.filter(
          (p) => p.status && activeCategoryIds.has(p.categoryId),
        );

        const grouped = activeProducts.reduce<Record<string, Product[]>>(
          (acc, product) => {
            const key = product.categoryName || "Otros";
            if (!acc[key]) acc[key] = [];
            acc[key].push(product);
            return acc;
          },
          {},
        );

        setCategories(
          Object.entries(grouped).map(([title, items]) => ({ title, items })),
        );
      } catch (err) {
        console.error(err);
        setError("No pudimos cargar el menú. Intenta de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* HEADER ELEGANTE */}
      <header className="bg-red-600 text-white pt-12 pb-8 px-6 rounded-b-[40px] shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight mb-1">
            saborEXPRESS
          </h1>
          <p className="text-red-100 text-sm font-medium uppercase tracking-wider">
            Menú Digital
          </p>
        </div>
      </header>

      {/* MENSAJE INFORMATIVO PARA EL CLIENTE */}
      <div className="mx-4 mt-6">
        <div className="bg-amber-100 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <span className="text-2xl">👋</span>
          <div>
            <h3 className="text-amber-900 font-bold text-sm">
              ¡Hola! Bienvenido
            </h3>
            <p className="text-amber-800 text-xs mt-1 leading-relaxed">
              Revisa nuestro delicioso menú. Cuando sepas qué deseas pedir,
              <span className="font-bold">
                {" "}
                indícale tu orden al mesero
              </span>{" "}
              que te está atendiendo.
            </p>
          </div>
        </div>
      </div>

      {/* ESTADOS DE CARGA / ERROR */}
      {loading && (
        <p className="text-center text-slate-400 mt-10">Cargando menú...</p>
      )}
      {error && <p className="text-center text-red-500 mt-10">{error}</p>}

      {/* LISTA DE CATEGORÍAS Y PRODUCTOS */}
      {!loading && !error && (
        <main className="px-4 mt-8 space-y-8">
          {categories.map((category, index) => (
            <section key={index}>
              <h2 className="text-xl font-extrabold text-slate-800 mb-4 ml-2 border-b-2 border-slate-200 pb-2">
                {category.title}
              </h2>

              <div className="space-y-4">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProduct(item)}
                    className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 active:scale-[0.98] transition-transform"
                  >
                    {item.photo && (
                      <img
                        src={`${SERVER_BASE_URL}${item.photo}`}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 leading-tight flex-1">
                          {item.name}
                        </h3>
                        <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full text-sm shrink-0">
                          ${item.price.toLocaleString("es-CO")}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}

          {categories.length === 0 && (
            <p className="text-center text-slate-400 mt-10">
              Aún no hay productos disponibles en el menú.
            </p>
          )}
        </main>
      )}

      {/* FOOTER */}
      <footer className="mt-12 text-center text-slate-400 text-xs pb-4">
        <p>
          © {new Date().getFullYear()} saborExpress. Todos los derechos
          reservados.
        </p>
        <p className="mt-1">Los precios incluyen impuestos.</p>
      </footer>

      {/* MODAL DE DETALLE DE PRODUCTO */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {selectedProduct.photo ? (
                <img
                  src={`${SERVER_BASE_URL}${selectedProduct.photo}`}
                  alt={selectedProduct.name}
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="w-full h-56 bg-slate-100 flex items-center justify-center text-slate-300 text-sm">
                  Sin imagen
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-600 hover:bg-white"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start gap-4 mb-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedProduct.name}
                </h2>
                <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full text-sm shrink-0">
                  ${selectedProduct.price.toLocaleString("es-CO")}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                {selectedProduct.categoryName || "Otros"}
              </p>

              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {selectedProduct.description}
              </p>

              <div className="flex items-center gap-2 text-slate-500 text-sm border-t border-slate-100 pt-4">
                <span>⏱️</span>
                <span>{selectedProduct.preparationTimeInMinutes} min</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
