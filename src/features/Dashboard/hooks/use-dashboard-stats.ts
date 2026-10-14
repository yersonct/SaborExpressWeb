"use client";

import { useCallback, useEffect, useState } from "react";
import {
  dashboardService,
  type DashboardStats,
} from "../services/dashboard.service";
import type { DateRangeOption } from "@/features/Payments/utils/date-ranges";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRealtimeEvents } from "./use-realtime-events";

export function useDashboardStats(
  branchId?: number,
  range: DateRangeOption = "hoy",
) {
  const { session } = useAuth();
  const userId = session?.userId ?? null;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // silent = true: recarga en segundo plano, sin mostrar "—" ni errores
  const fetchStats = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const data = await dashboardService.getStats(branchId, range);
        setStats(data);
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las métricas del dashboard",
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [branchId, range],
  );

  // Carga inicial y al cambiar de sede o periodo
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshImmediately = useCallback(() => {
    void fetchStats(true);
  }, [fetchStats]);

  // Tiempo real: el back emite OrdersChanged en pedidos, pagos y domicilios
  useRealtimeEvents(
    userId,
    ["OrdersChanged", "ProductsChanged"],
    refreshImmediately,
    refreshImmediately,
  );
  return { stats, loading, error, refetch: () => fetchStats() };
}
