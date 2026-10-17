"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { productService } from "../services/product.service";
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
} from "../types/product.types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useRealtimeConnectionStatus,
  useRealtimeEvents,
} from "@/features/Dashboard/hooks/use-realtime-events";

export function useProducts(branchId?: number) {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const realtimeStatus = useRealtimeConnectionStatus(userId);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  // silent = true: recarga en segundo plano, sin esqueleto ni errores en pantalla
  const fetchProducts = useCallback(
    async (silent = false) => {
      if (!hasLoadedRef.current) setLoading(true);
      if (!silent) setError("");
      try {
        const data = await productService.getAll(branchId);
        const sorted = [...data].sort((a, b) => b.id - a.id);
        setProducts(sorted);
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los productos",
          );
        }
      } finally {
        setLoading(false);
        hasLoadedRef.current = true;
      }
    },
    [branchId],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Tiempo real: el back emite ProductsChanged al crear, editar, borrar o activar/desactivar
  const refreshImmediately = useCallback(() => {
    void fetchProducts(true);
  }, [fetchProducts]);

  useRealtimeEvents(
    userId,
    ["ProductsChanged"],
    refreshImmediately,
    refreshImmediately,
  );

  const createProduct = async (payload: CreateProductPayload) => {
    await productService.create(payload);
    if (realtimeStatus !== "connected") await fetchProducts(true);
  };

  const updateProduct = async (id: number, payload: UpdateProductPayload) => {
    await productService.update(id, payload);
    if (realtimeStatus !== "connected") await fetchProducts(true);
  };

  const deleteProduct = async (id: number) => {
    await productService.remove(id);
    if (realtimeStatus !== "connected") await fetchProducts(true);
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await productService.updateStatus(id, !currentStatus);
    if (realtimeStatus !== "connected") await fetchProducts(true);
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
    refetch: () => fetchProducts(),
  };
}
