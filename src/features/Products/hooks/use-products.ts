"use client";

import { useCallback, useEffect, useState } from "react";
import { productService } from "../services/product.service";
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
} from "../types/product.types";

export function useProducts(branchId?: number) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await productService.getAll(branchId);
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setProducts(sorted);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los productos",
      );
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (payload: CreateProductPayload) => {
    await productService.create(payload);
    await fetchProducts();
  };

  const updateProduct = async (id: number, payload: UpdateProductPayload) => {
    await productService.update(id, payload);
    await fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    await productService.remove(id);
    await fetchProducts();
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await productService.updateStatus(id, !currentStatus);
    await fetchProducts();
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
    refetch: fetchProducts,
  };
}
