"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { paymentService } from "../services/payment.service";
import type { Payment, PaymentFilter } from "../types/payment.types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useRealtimeConnectionStatus,
  useRealtimeEvents,
} from "@/features/Dashboard/hooks/use-realtime-events";

export function usePayments(filter?: PaymentFilter, enabled?: boolean) {
  const isEnabled = enabled !== false;
  const { session } = useAuth();
  const userId = isEnabled ? (session?.userId ?? null) : null;
  const realtimeStatus = useRealtimeConnectionStatus(userId);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(isEnabled);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  // silent = true: recarga en segundo plano, sin parpadeo ni errores en pantalla
  const fetchPayments = useCallback(
    async (silent = false) => {
      if (!isEnabled) {
        setLoading(false);
        return;
      }
      if (!hasLoadedRef.current) setLoading(true);
      if (!silent) setError("");
      try {
        const data = await paymentService.getAll(filter);
        setPayments(data);
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los pagos",
          );
        }
      } finally {
        setLoading(false);
        hasLoadedRef.current = true;
      }
    },
    [isEnabled, filter?.branchId, filter?.fromDate, filter?.toDate],
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Tiempo real: el backend publica el cambio de pago al crearlo, aprobarlo o reembolsarlo.
  const refreshImmediately = useCallback(() => {
    void fetchPayments(true);
  }, [fetchPayments]);

  useRealtimeEvents(
    userId,
    ["PaymentsChanged"],
    refreshImmediately,
    refreshImmediately,
  );

  const refundPayment = async (id: number, reason: string) => {
    await paymentService.refund(id, { reason });
    if (realtimeStatus !== "connected") await fetchPayments(true);
  };

  return {
    payments,
    loading,
    error,
    refetch: () => fetchPayments(),
    refundPayment,
  };
}
