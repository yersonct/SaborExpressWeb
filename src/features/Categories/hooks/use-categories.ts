"use client";

import { useCallback, useEffect, useState } from "react";
import { categoryService } from "../services/category.service";
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/category.types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await categoryService.getAll();
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setCategories(sorted);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las categorías",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (payload: CreateCategoryPayload) => {
    await categoryService.create(payload);
    await fetchCategories();
  };

  const updateCategory = async (id: number, payload: UpdateCategoryPayload) => {
    await categoryService.update(id, payload);
    await fetchCategories();
  };

  const deleteCategory = async (id: number) => {
    await categoryService.remove(id);
    await fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
