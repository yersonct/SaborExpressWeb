export enum NotificationType {
  OrderCreated = "OrderCreated",
  OrderStatusChanged = "OrderStatusChanged",
  OrderReady = "OrderReady",
  DeliveryAssigned = "DeliveryAssigned",
  DeliveryInTransit = "DeliveryInTransit",
  DeliveryCompleted = "DeliveryCompleted",
  ShiftEndingSoon = "ShiftEndingSoon",
  PaymentConfirmed = "PaymentConfirmed",
  Manual = "Manual",
  System = "System",
  ReviewReceived = "ReviewReceived",
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
