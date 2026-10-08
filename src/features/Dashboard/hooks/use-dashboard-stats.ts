"use client";

import { useCallback, useEffect, useState } from "react";
import {
  dashboardService,
  type DashboardStats,
} from "../services/dashboard.service";

export function useDashboardStats(branchId?: number) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardService.getStats(branchId);
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las métricas del dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
