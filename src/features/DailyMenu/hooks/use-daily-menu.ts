"use client";

import { useCallback, useEffect, useState } from "react";
import { dailyMenuService } from "../services/daily-menu.service";
import type {
  DailyMenuItem,
  CreateDailyMenuItemPayload,
  UpdateDailyMenuItemPayload,
  BulkSetDailyMenuPayload,
} from "../types/daily-menu.types";

export function useDailyMenu(
  branchId?: number,
  date?: string,
  period?: string,
) {
  const isEnabled = !!branchId && !!date;
  const [items, setItems] = useState<DailyMenuItem[]>([]);
  const [loading, setLoading] = useState(isEnabled);
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    if (!branchId || !date) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await dailyMenuService.getByBranchAndDate(
        branchId,
        date,
        period,
      );
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el menú del día",
      );
    } finally {
      setLoading(false);
    }
  }, [branchId, date, period]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (payload: CreateDailyMenuItemPayload) => {
    await dailyMenuService.create(payload);
    await fetchItems();
  };

  const bulkSetItems = async (payload: BulkSetDailyMenuPayload) => {
    await dailyMenuService.bulkSet(payload);
    await fetchItems();
  };

  const updateItem = async (
    id: number,
    payload: UpdateDailyMenuItemPayload,
  ) => {
    await dailyMenuService.update(id, payload);
    await fetchItems();
  };

  const toggleItem = async (id: number) => {
    await dailyMenuService.toggleAvailability(id);
    await fetchItems();
  };

  const deleteItem = async (id: number) => {
    await dailyMenuService.remove(id);
    await fetchItems();
  };

  return {
    items,
    loading,
    error,
    createItem,
    bulkSetItems,
    updateItem,
    toggleItem,
    deleteItem,
    refetch: fetchItems,
  };
}
