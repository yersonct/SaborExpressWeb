"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useRealtimeConnectionStatus,
  useRealtimeEvents,
} from "@/features/Dashboard/hooks/use-realtime-events";
import { orderService } from "../services/order.service";
import type {
  Order,
  CreateOrderDetailPayload,
  UpdateOrderDetailPayload,
  VoidOrderDetailPayload,
} from "../types/order.types";

export function useOrderDetail(orderId: number | null) {
  const { session } = useAuth();
  const realtimeStatus = useRealtimeConnectionStatus(session?.userId ?? null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async (silent = false) => {
    if (orderId == null) {
      setOrder(null);
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await orderService.getById(orderId);
      setOrder(data);
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el pedido",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const refreshForOrderChange = useCallback(() => {
    void fetchOrder(true);
  }, [fetchOrder]);
  useRealtimeEvents(
    session?.userId ?? null,
    ["OrdersChanged"],
    refreshForOrderChange,
    refreshForOrderChange,
  );

  const addProduct = async (payload: CreateOrderDetailPayload) => {
    if (!orderId) return;
    await orderService.addDetail(orderId, payload);
    if (realtimeStatus !== "connected") await fetchOrder(true);
  };

  const updateProduct = async (
    detailId: number,
    payload: UpdateOrderDetailPayload,
  ) => {
    await orderService.updateDetail(detailId, payload);
    if (realtimeStatus !== "connected") await fetchOrder(true);
  };

  const voidProduct = async (
    detailId: number,
    payload: VoidOrderDetailPayload,
  ) => {
    await orderService.voidDetail(detailId, payload);
    if (realtimeStatus !== "connected") await fetchOrder(true);
  };

  return {
    order,
    loading,
    error,
    addProduct,
    updateProduct,
    voidProduct,
    refetch: fetchOrder,
  };
}
