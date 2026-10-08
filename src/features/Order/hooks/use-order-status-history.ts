"use client";

import { useCallback, useEffect, useState } from "react";
import { orderStatusHistoryService } from "../services/order-status-history.service";
import type { OrderStatusHistory } from "../types/order-status-history.types";

export function useOrderStatusHistory(orderId: number | null) {
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    if (!orderId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await orderStatusHistoryService.getByOrder(orderId);
      // más antiguo primero, para leerlo como línea de tiempo de arriba a abajo
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
      );
      setHistory(sorted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el historial",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}
