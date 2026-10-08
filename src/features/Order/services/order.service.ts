import { http } from "@/config/api";
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderPayload,
  UpdateOrderStatusPayload,
  CancelOrderPayload,
  OrderFilter,
  OrderDetail,
  CreateOrderDetailPayload,
  UpdateOrderDetailPayload,
  VoidOrderDetailPayload,
} from "../types/order.types";

export const orderService = {
  // POST /api/Orders — crea el pedido vacío (sin productos todavía)
  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await http.post<Order>("/Orders", payload);
    return data;
  },

  // GET /api/Orders/{id}
  getById: async (id: number): Promise<Order> => {
    const { data } = await http.get<Order>(`/Orders/${id}`);
    return data;
  },

  // GET /api/Orders?branchId=&status=
  getAll: async (filter?: OrderFilter): Promise<Order[]> => {
    const { data } = await http.get<Order[]>("/Orders", { params: filter });
    return data;
  },

  // GET /api/Orders/table/{tableId}
  getByTable: async (tableId: number): Promise<Order[]> => {
    const { data } = await http.get<Order[]>(`/Orders/table/${tableId}`);
    return data;
  },

  // GET /api/Orders/customer/{customerId}
  getByCustomer: async (customerId: number): Promise<Order[]> => {
    const { data } = await http.get<Order[]>(`/Orders/customer/${customerId}`);
    return data;
  },

  // GET /api/Orders/branch/{branchId}
  getByBranch: async (branchId: number): Promise<Order[]> => {
    const { data } = await http.get<Order[]>(`/Orders/branch/${branchId}`);
    return data;
  },

  // PUT /api/Orders/{id}
  update: async (id: number, payload: UpdateOrderPayload): Promise<Order> => {
    const { data } = await http.put<Order>(`/Orders/${id}`, payload);
    return data;
  },

  // PATCH /api/Orders/{id}/status
  updateStatus: async (
    id: number,
    payload: UpdateOrderStatusPayload,
  ): Promise<Order> => {
    const { data } = await http.patch<Order>(`/Orders/${id}/status`, payload);
    return data;
  },

  // PATCH /api/Orders/{id}/cancel
  cancel: async (id: number, payload: CancelOrderPayload): Promise<Order> => {
    const { data } = await http.patch<Order>(`/Orders/${id}/cancel`, payload);
    return data;
  },

  // --- OrderDetails (productos dentro del pedido) ---

  // GET /api/orders/{orderId}/details
  getDetails: async (orderId: number): Promise<OrderDetail[]> => {
    const { data } = await http.get<OrderDetail[]>(
      `/orders/${orderId}/details`,
    );
    return data;
  },

  // POST /api/orders/{orderId}/details — agrega un producto al pedido
  addDetail: async (
    orderId: number,
    payload: CreateOrderDetailPayload,
  ): Promise<OrderDetail> => {
    const { data } = await http.post<OrderDetail>(
      `/orders/${orderId}/details`,
      payload,
    );
    return data;
  },

  // PUT /api/order-details/{id} — edita cantidad/notas de una línea
  updateDetail: async (
    id: number,
    payload: UpdateOrderDetailPayload,
  ): Promise<OrderDetail> => {
    const { data } = await http.put<OrderDetail>(
      `/order-details/${id}`,
      payload,
    );
    return data;
  },

  // PATCH /api/order-details/{id}/void — anula una línea (no la borra)
  voidDetail: async (
    id: number,
    payload: VoidOrderDetailPayload,
  ): Promise<OrderDetail> => {
    const { data } = await http.patch<OrderDetail>(
      `/order-details/${id}/void`,
      payload,
    );
    return data;
  },
};
