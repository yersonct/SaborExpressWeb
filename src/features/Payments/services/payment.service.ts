import { http } from "@/config/api";
import type {
  Payment,
  PaymentFilter,
  RefundPaymentPayload,
} from "../types/payment.types";

export const paymentService = {
  // GET /api/Payments?branchId=&fromDate=&toDate= — Gerente/Admin (reportes de caja)
  getAll: async (filter?: PaymentFilter): Promise<Payment[]> => {
    const { data } = await http.get<Payment[]>("/Payments", {
      params: filter,
    });
    return data;
  },

  // GET /api/Payments/order/{orderId}
  getByOrder: async (orderId: number): Promise<Payment[]> => {
    const { data } = await http.get<Payment[]>(`/Payments/order/${orderId}`);
    return data;
  },

  // GET /api/Payments/{id}
  getById: async (id: number): Promise<Payment> => {
    const { data } = await http.get<Payment>(`/Payments/${id}`);
    return data;
  },

  // PATCH /api/Payments/{id}/refund
  refund: async (
    id: number,
    payload: RefundPaymentPayload,
  ): Promise<Payment> => {
    const { data } = await http.patch<Payment>(
      `/Payments/${id}/refund`,
      payload,
    );
    return data;
  },
};
