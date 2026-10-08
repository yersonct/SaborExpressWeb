import type { OrderStatus } from "./order.types";

export interface OrderStatusHistory {
  id: number;
  orderId: number;
  status: OrderStatus;
  notes: string | null;
  changedByEmployeeId: number | null;
  changedByEmployeeName: string | null;
  changedAt: string;
}
