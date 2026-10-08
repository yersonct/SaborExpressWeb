"use client";

import { useCallback, useEffect, useState } from "react";
import { orderService } from "../services/order.service";
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await orderService.getAll(filter);
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setOrders(sorted);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los pedidos",
      );
    } finally {
      setLoading(false);
    }
  }, [filter?.branchId, filter?.status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (payload: CreateOrderPayload) => {
    const created = await orderService.create(payload);
    await fetchOrders();
    return created;
  };

  const updateStatus = async (
    id: number,
    payload: UpdateOrderStatusPayload,
  ) => {
    await orderService.updateStatus(id, payload);
    await fetchOrders();
  };

  const cancelOrder = async (id: number, payload: CancelOrderPayload) => {
    await orderService.cancel(id, payload);
    await fetchOrders();
  };

  return {
    orders,
    loading,
    error,
    createOrder,
    updateStatus,
    cancelOrder,
    refetch: fetchOrders,
  };
}
