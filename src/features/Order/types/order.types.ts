export enum OrderType {
  DineIn = "DineIn",
  ToGo = "ToGo",
  Delivery = "Delivery",
  Pickup = "Pickup",
}

export enum OrderStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  InPreparation = "InPreparation",
  Ready = "Ready",
  Delivered = "Delivered",
  Cancelled = "Cancelled",
}

export enum OrderChannel {
  App = "App",
  Mostrador = "Mostrador",
}

export enum OrderDetailStatus {
  Pending = "Pending",
  InPreparation = "InPreparation",
  Ready = "Ready",
  Delivered = "Delivered",
  Cancelled = "Cancelled",
  Voided = "Voided",
}

export interface OrderDetail {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  notes: string | null;
  isToGo: boolean;
  batchNumber: number;
  status: OrderDetailStatus;
  lastModifiedByEmployeeId: number;
  lastModifiedByEmployeeName: string | null;
}

export interface Order {
  id: number;
  customerId: number | null;
  customerName: string | null;
  employeeId: number | null;
  employeeName: string | null;
  tableId: number | null;
  tableNumber: number | null;
  branchId: number;
  branchName: string | null;
  orderType: OrderType;
  status: OrderStatus;
  subTotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  orderDetails: OrderDetail[];
}

export interface CreateOrderPayload {
  customerId?: number;
  tableId?: number;
  branchId: number;
  orderType: OrderType;
  notes?: string;
}

export interface UpdateOrderPayload {
  tableId?: number;
  orderType: OrderType;
  notes?: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  notes?: string;
}

export interface CancelOrderPayload {
  reason: string;
}

export interface OrderFilter {
  branchId?: number;
  status?: OrderStatus;
}

export interface CreateOrderDetailPayload {
  productId: number;
  quantity: number;
  notes?: string;
}
export interface UpdateOrderDetailPayload {
  quantity: number;
  notes?: string;
}

export interface VoidOrderDetailPayload {
  reason: string;
}