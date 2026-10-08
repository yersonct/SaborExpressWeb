"use client";

import { useCallback, useEffect, useState } from "react";
import { orderService } from "../services/order.service";
import type {
  Order,
  CreateOrderDetailPayload,
  UpdateOrderDetailPayload,
  VoidOrderDetailPayload,
} from "../types/order.types";

export function useOrderDetail(orderId: number | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    try {
      const data = await orderService.getById(orderId);
      setOrder(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el pedido",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const addProduct = async (payload: CreateOrderDetailPayload) => {
    if (!orderId) return;
    await orderService.addDetail(orderId, payload);
    await fetchOrder();
  };

  const updateProduct = async (
    detailId: number,
    payload: UpdateOrderDetailPayload,
  ) => {
    await orderService.updateDetail(detailId, payload);
    await fetchOrder();
  };

  const voidProduct = async (
    detailId: number,
    payload: VoidOrderDetailPayload,
  ) => {
    await orderService.voidDetail(detailId, payload);
    await fetchOrder();
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
