import { Payment, PaymentMethod, PaymentStatus } from "../types/payment.types";

export function summarizeByMethod(payments: Payment[]) {
  const methods = [
    PaymentMethod.Cash,
    PaymentMethod.Card,
    PaymentMethod.Transfer,
    PaymentMethod.Wompi,
  ];

  return methods.map((method) => ({
    method,
    total: payments
      .filter(
        (p) => p.method === method && p.status === PaymentStatus.Completed,
      )
      .reduce((sum, p) => sum + p.amount, 0),
  }));
}

export function summarizeByStatus(payments: Payment[]) {
  const statuses = [
    PaymentStatus.Completed,
    PaymentStatus.Pending,
    PaymentStatus.Failed,
    PaymentStatus.Refunded,
  ];

  return statuses.map((status) => ({
    status,
    count: payments.filter((p) => p.status === status).length,
  }));
}

export function totalConfirmed(payments: Payment[]) {
  return payments
    .filter((p) => p.status === PaymentStatus.Completed)
    .reduce((sum, p) => sum + p.amount, 0);
}
