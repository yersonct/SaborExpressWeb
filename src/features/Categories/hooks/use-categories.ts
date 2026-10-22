"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deferEffect } from "@/lib/defer-effect";
import { categoryService } from "../services/category.service";
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/category.types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useRealtimeConnectionStatus,
  useRealtimeEvents,
} from "@/features/Dashboard/hooks/use-realtime-events";

export function useCategories() {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const realtimeStatus = useRealtimeConnectionStatus(userId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  const fetchCategories = useCallback(async (silent = false) => {
    if (!hasLoadedRef.current) setLoading(true);
    if (!silent) setError("");
    try {
      const data = await categoryService.getAll();
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setCategories(sorted);
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las categorías",
        );
      }
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, []);

  useEffect(() => deferEffect(() => void fetchCategories()), [fetchCategories]);

  const refreshImmediately = useCallback(() => {
    void fetchCategories(true);
  }, [fetchCategories]);

  useRealtimeEvents(
    userId,
    ["ProductsChanged"],
    refreshImmediately,
    refreshImmediately,
  );

  const createCategory = async (payload: CreateCategoryPayload) => {
    await categoryService.create(payload);
    if (realtimeStatus !== "connected") await fetchCategories(true);
  };

  const updateCategory = async (id: number, payload: UpdateCategoryPayload) => {
    await categoryService.update(id, payload);
    if (realtimeStatus !== "connected") await fetchCategories(true);
  };

  const deleteCategory = async (id: number) => {
    await categoryService.remove(id);
    if (realtimeStatus !== "connected") await fetchCategories(true);
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: () => fetchCategories(),
  };
}
