export enum PaymentMethod {
  Cash = "Cash",
  Card = "Card",
  Transfer = "Transfer",
  Wompi = "Wompi",
}

export enum PaymentStatus {
  Pending = "Pending",
  Completed = "Completed",
  Failed = "Failed",
  Refunded = "Refunded",
}

export interface Payment {
  id: number;
  orderId: number;
  cashierId: number | null;
  cashierName: string | null;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt: string;
  wompiReference: string | null;
  wompiTransactionId: string | null;
}

export interface PaymentFilter {
  branchId?: number;
  fromDate?: string; // ISO date
  toDate?: string; // ISO date
}

export interface RefundPaymentPayload {
  reason: string;
}
