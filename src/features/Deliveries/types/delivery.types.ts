export type DeliveryStatus = "Assigned" | "InTransit" | "Delivered";

export interface Delivery {
  id: number;
  orderId: number;
  addressId: number;
  addressText: string | null;
  deliveryPersonId: number;
  deliveryPersonName: string | null;
  status: DeliveryStatus;
  assignedAt: string;
  deliveredAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  itemsCount: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
}

export interface DeliveryPerson {
  employeeId: number;
  name: string;
  lastName: string | null;
  isAvailable: boolean;
  activeDeliveryCount: number;
}

export interface CreateDeliveryPayload {
  orderId: number;
  deliveryPersonId: number;
}

export interface UpdateDeliveryStatusPayload {
  status: DeliveryStatus;
}
