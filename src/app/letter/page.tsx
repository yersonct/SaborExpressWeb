"use client";

import { translateCopy } from "@/config/copy-translations";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { productPublicService } from "@/features/Products/services/product.public.service";
import { categoryPublicService } from "@/features/Categories/services/category.public.service";
import { branchPublicService } from "@/features/branches/services/branch.public.service";
import type { PublicBranchInfo } from "@/features/branches/types/branch.types";
import { SERVER_BASE_URL } from "@/config/api";
import type { Product } from "@/features/Products/types/product.types";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { formatMoney } from "@/lib/format-money";
import Image from "next/image";
import * as signalR from "@microsoft/signalr";

interface CategoryGroup {
  title: string;
  items: Product[];
}

function localizeMenuText(
  language: string | undefined,
  source: string,
  english?: string | null,
  portuguese?: string | null,
  french?: string | null,
) {
  const code = (language ?? "es").split("-")[0].toLowerCase();
  const savedTranslation = code === "en"
    ? english
    : code === "pt"
      ? portuguese
      : code === "fr"
        ? french
        : source;
  return savedTranslation?.trim() || translateCopy(source);
}

function productCategory(product: Product, language: string | undefined) {
  return localizeMenuText(
    language,
    product.categoryName,
    product.categoryNameEn,
    product.categoryNamePt,
    product.categoryNameFr,
  );
}

export default function CartaDigital() {
  const { i18n: activeI18n } = useTranslation();
  const currentLanguage = activeI18n.resolvedLanguage ?? activeI18n.language;
  const productName = (product: Product) =>
    localizeMenuText(
      currentLanguage,
      product.name,
      product.nameEn,
      product.namePt,
      product.nameFr,
    );
  const productDescription = (product: Product) =>
    localizeMenuText(
      currentLanguage,
      product.description,
      product.descriptionEn,
      product.descriptionPt,
      product.descriptionFr,
    );
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<PublicBranchInfo | null>(null);
  const branchIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    let latestRequest = 0;
    let initialLoadFinished = false;
    let refreshQueued = false;
    let cachedBranches: PublicBranchInfo[] | null = null;
    let branchesRequest: Promise<PublicBranchInfo[]> | null = null;
    let branchesCacheVersion = 0;
    let connection: signalR.HubConnection | null = null;
    let retryTimer: number | null = null;
    let retryAttempt = 0;

    const getPublicBranches = () => {
      if (cachedBranches) return Promise.resolve(cachedBranches);
      if (!branchesRequest) {
        const requestVersion = branchesCacheVersion;
        branchesRequest = branchPublicService.getAll()
          .then((branches) => {
            if (requestVersion === branchesCacheVersion) {
              cachedBranches = branches;
            }
            return branches;
          })
          .catch(() => {
            branchesRequest = null;
            return [];
          });
      }
      return branchesRequest;
    };

    async function loadMenu(silent = false) {
      const request = ++latestRequest;
      if (!silent) {
        setLoading(true);
        setHasError(false);
      }
      try {
        const menuUrl = new URL(window.location.href);
        const requestedBranchId = Number(menuUrl.searchParams.get("branchId"));
        let savedBranchId = 0;
        try {
          savedBranchId = Number(
            window.sessionStorage.getItem("sabor-express:public-menu-branch"),
          );
        } catch {
          // La carta sigue funcionando aunque el navegador bloquee el almacenamiento.
        }
        const branchId =
          Number.isSafeInteger(requestedBranchId) && requestedBranchId > 0
            ? requestedBranchId
            : Number.isSafeInteger(savedBranchId) && savedBranchId > 0
              ? savedBranchId
              : branchIdRef.current;
        branchIdRef.current = branchId;

        if (branchId !== undefined) {
          try {
            window.sessionStorage.setItem(
              "sabor-express:public-menu-branch",
              String(branchId),
            );
          } catch {
            // No bloquear la carga de la carta si el almacenamiento está desactivado.
          }
        }
        if (menuUrl.searchParams.has("branchId")) {
          menuUrl.searchParams.delete("branchId");
          window.history.replaceState(
            window.history.state,
            "",
            `${menuUrl.pathname}${menuUrl.search}${menuUrl.hash}`,
          );
        }

        const [products, cats, publicBranches] = await Promise.all([
          productPublicService.getAll(branchId),
          categoryPublicService.getAll(),
          getPublicBranches(),
        ]);
        if (!active || request !== latestRequest) return;
        setHasError(false);

        const currentBranch = branchId
          ? publicBranches.find((branch) => branch.id === branchId)
          : publicBranches.length === 1
            ? publicBranches[0]
            : undefined;
        setSelectedBranch(currentBranch ?? null);

        // Solo las categorías con status = true pueden mostrar productos
        const activeCategoryIds = new Set(
          cats.filter((c) => c.status).map((c) => c.id),
        );

        // Un producto se muestra SOLO si él está activo Y su categoría está activa
        const activeProducts = products.filter(
          (p) => p.status && activeCategoryIds.has(p.categoryId),
        );
        setSelectedProduct((selected) =>
          selected && activeProducts.some((product) => product.id === selected.id)
            ? selected
            : null,
        );

        const grouped = activeProducts.reduce<Record<string, Product[]>>(
          (acc, product) => {
            const key = product.categoryName
              ? productCategory(product, currentLanguage)
              : translateCopy("Otros");
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
        if (active && request === latestRequest && !silent) setHasError(true);
      } finally {
        if (active && request === latestRequest) {
          initialLoadFinished = true;
          setLoading(false);
          if (refreshQueued && !document.hidden) {
            refreshQueued = false;
            void loadMenu(true);
          }
        }
      }
    }

    void loadMenu();
    const refreshVisibleMenu = () => {
      if (!active || document.hidden) return;
      if (!initialLoadFinished) {
        refreshQueued = true;
        return;
      }
      void loadMenu(true);
    };
    const refreshPublicBranches = async () => {
      branchesCacheVersion += 1;
      cachedBranches = null;
      branchesRequest = null;
      if (!active || document.hidden) return;
      const publicBranches = await getPublicBranches();
      if (!active) return;
      const branchId = branchIdRef.current;
      const currentBranch = branchId
        ? publicBranches.find((branch) => branch.id === branchId)
        : publicBranches.length === 1
          ? publicBranches[0]
          : undefined;
      setSelectedBranch(currentBranch ?? null);
    };

    const scheduleConnectionRetry = () => {
      if (!active || retryTimer !== null) return;
      const delays = [1000, 2000, 5000, 15000, 30000];
      const delay = delays[Math.min(retryAttempt, delays.length - 1)];
      retryAttempt += 1;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        void connect();
      }, delay);
    };
    const connect = async () => {
      if (
        !active ||
        !connection ||
        connection.state !== signalR.HubConnectionState.Disconnected
      ) return;
      const activeConnection = connection;
      try {
        await activeConnection.start();
        if (!active) return;
        retryAttempt = 0;
        refreshVisibleMenu();
      } catch {
        scheduleConnectionRetry();
      }
    };

    const hubBase = SERVER_BASE_URL || window.location.origin;
    connection = new signalR.HubConnectionBuilder()
      .withUrl(new URL("/hubs/public-menu", hubBase).toString(), {
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Critical)
      .build();
    connection.on("MenuChanged", refreshVisibleMenu);
    connection.on("BranchesChanged", refreshPublicBranches);
    connection.onreconnected(() => {
      retryAttempt = 0;
      refreshVisibleMenu();
    });
    connection.onclose(() => {
      scheduleConnectionRetry();
    });
    void connect();

    window.addEventListener("focus", refreshVisibleMenu);
    document.addEventListener("visibilitychange", refreshVisibleMenu);

    return () => {
      active = false;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (connection) {
        connection.off("MenuChanged", refreshVisibleMenu);
        connection.off("BranchesChanged", refreshPublicBranches);
        void connection.stop();
      }
      window.removeEventListener("focus", refreshVisibleMenu);
      document.removeEventListener("visibilitychange", refreshVisibleMenu);
    };
  }, [currentLanguage]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* HEADER ELEGANTE */}
      <header className="relative rounded-b-[40px] bg-red-600 px-4 pb-8 pt-12 text-white shadow-lg sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight mb-1">
             {translateCopy("saborEXPRESS")} </h1>
          <p className="text-red-100 text-sm font-medium uppercase tracking-wider">
             {translateCopy("Menú Digital")} </p>
        </div>
      </header>

      <div className="mx-4 mt-4 flex items-center justify-end gap-2">
        <ThemeToggle />
        <div className="w-40">
          <LanguageSelector direction="down" />
        </div>
      </div>

      {selectedBranch && (
        <section className="mx-4 mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">
            {translateCopy("Sede")}: {selectedBranch.name}
          </h2>
          <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <p>
              <span className="font-semibold">{translateCopy("Teléfono")}:</span>{" "}
              {selectedBranch.phone ? (
                <a href={`tel:${selectedBranch.phone}`} className="hover:underline">
                  {selectedBranch.phone}
                </a>
              ) : (
                translateCopy("Sin teléfono")
              )}
            </p>
            <p>
              <span className="font-semibold">{translateCopy("Dirección")}:</span>{" "}
              {selectedBranch.address || translateCopy("Sin dirección")}
            </p>
          </div>
        </section>
      )}

      {/* MENSAJE INFORMATIVO PARA EL CLIENTE */}
      <div className="mx-4 mt-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-100 p-4 shadow-sm">
          <span className="text-2xl">👋</span>
          <div>
            <h3 className="text-amber-900 font-bold text-sm">
               {translateCopy("¡Hola! Bienvenido")} </h3>
            <p className="text-amber-800 text-xs mt-1 leading-relaxed">
               {translateCopy("Revisa nuestro delicioso menú. Cuando sepas qué deseas pedir,")} <span className="font-bold">
                {" "}
                 {translateCopy("indícale tu orden al mesero")} </span>{" "}
               {translateCopy("que te está atendiendo.")} </p>
          </div>
        </div>
      </div>

      {/* ESTADOS DE CARGA / ERROR */}
      {loading && (
        <p className="text-center text-slate-400 mt-10">{translateCopy("Cargando menú...")}</p>
      )}
      {hasError && (
        <p className="text-center text-red-500 mt-10">
          {translateCopy("No pudimos cargar el menú. Intenta de nuevo más tarde.")}
        </p>
      )}

      {/* LISTA DE CATEGORÍAS Y PRODUCTOS */}
      {!loading && !hasError && (
        <main className="px-4 mt-8 space-y-8">
          {categories.map((category, index) => (
            <section key={index}>
              <h2 className="text-xl font-extrabold text-slate-800 mb-4 ml-2 border-b-2 border-slate-200 pb-2">
                {translateCopy(category.title)}
              </h2>

              <div className="space-y-4">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProduct(item)}
                    className="flex w-full min-w-0 gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
                  >
                    {item.photo && (
                      <Image
                        src={`${SERVER_BASE_URL}${item.photo}`}
                        alt={productName(item)}
                        width={80}
                        height={80}
                        unoptimized
                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="min-w-0 flex-1 break-words text-lg font-bold leading-tight text-slate-900">
                          {productName(item)}
                        </h3>
                        <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full text-sm shrink-0">
                          {formatMoney(item.price)}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                        {productDescription(item)}
                      </p>
                      {item.preparationTimeInMinutes > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4 shrink-0"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                          </svg>
                          <span>
                            {translateCopy("Preparación aprox.")}: {item.preparationTimeInMinutes} {translateCopy("min")}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}

          {categories.length === 0 && (
            <p className="text-center text-slate-400 mt-10">
               {translateCopy("Aún no hay productos disponibles en el menú.")} </p>
          )}
        </main>
      )}

      {/* FOOTER */}
      <footer className="mt-12 text-center text-slate-400 text-xs pb-4">
        <p>
          © {new Date().getFullYear()}  {translateCopy("saborExpress. Todos los derechos reservados.")} </p>
        <p className="mt-1">{translateCopy("Los precios incluyen el Impoconsumo aplicable.")}</p>
      </footer>

      {/* MODAL DE DETALLE DE PRODUCTO */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white sm:max-w-md sm:rounded-3xl">
            <div className="relative">
              {selectedProduct.photo ? (
                <Image
                  src={`${SERVER_BASE_URL}${selectedProduct.photo}`}
                  alt={productName(selectedProduct)}
                  width={640}
                  height={448}
                  unoptimized
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="w-full h-56 bg-slate-100 flex items-center justify-center text-slate-300 text-sm">
                   {translateCopy("Sin imagen")} </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-600 hover:bg-white"
                aria-label={translateCopy("Cerrar")}
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start gap-4 mb-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {productName(selectedProduct)}
                </h2>
                <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full text-sm shrink-0">
                  {formatMoney(selectedProduct.price)}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                {selectedProduct.categoryName
                  ? productCategory(selectedProduct, currentLanguage)
                  : translateCopy("Otros")}
              </p>

              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {productDescription(selectedProduct)}
              </p>

              <div className="flex items-center gap-2 text-slate-500 text-sm border-t border-slate-100 pt-4">
                <span>⏱️</span>
                <span>{translateCopy("Preparación aprox.")}: {selectedProduct.preparationTimeInMinutes} {translateCopy("min")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
