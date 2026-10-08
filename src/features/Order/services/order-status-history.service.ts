import { http } from "@/config/api";
import type { OrderStatusHistory } from "../types/order-status-history.types";

export const orderStatusHistoryService = {
  // GET /api/orders/{orderId}/status-history — cualquier usuario autenticado
  getByOrder: async (orderId: number): Promise<OrderStatusHistory[]> => {
    const { data } = await http.get<OrderStatusHistory[]>(
      `/orders/${orderId}/status-history`,
    );
    return data;
  },
};
