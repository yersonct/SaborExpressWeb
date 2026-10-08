"use client";

import { useCallback, useEffect, useState } from "react";
import { paymentService } from "../services/payment.service";
import type { Payment, PaymentFilter } from "../types/payment.types";

export function usePayments(filter?: PaymentFilter, enabled?: boolean) {
  const isEnabled = enabled !== false;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(isEnabled);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async () => {
    if (!isEnabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await paymentService.getAll(filter);
      setPayments(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los pagos",
      );
    } finally {
      setLoading(false);
    }
  }, [isEnabled, filter?.branchId, filter?.fromDate, filter?.toDate]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const refundPayment = async (id: number, reason: string) => {
    await paymentService.refund(id, { reason });
    await fetchPayments();
  };

  return { payments, loading, error, refetch: fetchPayments, refundPayment };
}
