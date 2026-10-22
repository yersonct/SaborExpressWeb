"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deferEffect } from "@/lib/defer-effect";
import { orderService } from "../services/order.service";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useRealtimeConnectionStatus,
  useRealtimeEvents,
} from "@/features/Dashboard/hooks/use-realtime-events";
import type {
  Order,
  OrderFilter,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  CancelOrderPayload,
} from "../types/order.types";

export function useOrders(filter?: OrderFilter) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { session } = useAuth();
  const branchId = filter?.branchId;
  const status = filter?.status;
  const fromDate = filter?.fromDate;
  const toDate = filter?.toDate;
  const userId = session?.userId ?? null;
  const realtimeStatus = useRealtimeConnectionStatus(userId);
  const hasLoadedRef = useRef(false);

  // silent = true: recarga en segundo plano, sin mostrar errores en el tablero
  const fetchOrders = useCallback(async (silent = false) => {
    if (!hasLoadedRef.current) setLoading(true);
    if (!silent) setError("");
    try {
      const data = await orderService.getAll({ branchId, status, fromDate, toDate });
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setOrders(sorted);
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los pedidos",
        );
      }
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [branchId, status, fromDate, toDate]);

  useEffect(() => deferEffect(() => void fetchOrders()), [fetchOrders]);

  // Tiempo real: junta varios eventos seguidos en una sola recarga
  const refreshImmediately = useCallback(() => {
    void fetchOrders(true);
  }, [fetchOrders]);

  useRealtimeEvents(userId, ["OrdersChanged"], refreshImmediately, refreshImmediately);

  const createOrder = async (payload: CreateOrderPayload) => {
    const created = await orderService.create(payload);
    if (realtimeStatus !== "connected") await fetchOrders(true);
    return created;
  };

  const updateStatus = async (
    id: number,
    payload: UpdateOrderStatusPayload,
  ) => {
    await orderService.updateStatus(id, payload);
    if (realtimeStatus !== "connected") await fetchOrders(true);
  };

  const cancelOrder = async (id: number, payload: CancelOrderPayload) => {
    await orderService.cancel(id, payload);
    if (realtimeStatus !== "connected") await fetchOrders(true);
  };

  return {
    orders,
    loading,
    error,
    createOrder,
    updateStatus,
    cancelOrder,
    refetch: () => fetchOrders(),
  };
}
