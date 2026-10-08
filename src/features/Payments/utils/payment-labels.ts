import { PaymentMethod, PaymentStatus } from "../types/payment.types";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.Cash]: "Efectivo",
  [PaymentMethod.Card]: "Tarjeta",
  [PaymentMethod.Transfer]: "Transferencia",
  [PaymentMethod.Wompi]: "Wompi",
};

export const paymentMethodDotColor: Record<PaymentMethod, string> = {
  [PaymentMethod.Cash]: "bg-green-500",
  [PaymentMethod.Card]: "bg-purple-500",
  [PaymentMethod.Transfer]: "bg-blue-500",
  [PaymentMethod.Wompi]: "bg-yellow-500",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: "Pendiente",
  [PaymentStatus.Completed]: "Confirmado",
  [PaymentStatus.Failed]: "Fallido",
  [PaymentStatus.Refunded]: "Reembolsado",
};

export const paymentStatusBadgeClasses: Record<PaymentStatus, string> = {
  [PaymentStatus.Completed]: "bg-green-50 text-green-700 border-green-200",
  [PaymentStatus.Pending]:
    "bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse",
  [PaymentStatus.Failed]: "bg-red-100 text-red-700 border-red-200",
  [PaymentStatus.Refunded]: "bg-gray-100 text-gray-600 border-gray-200",
};
