"use client";

import { useCallback, useEffect, useState } from "react";
import { deferEffect } from "@/lib/defer-effect";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAdminDataChanged } from "@/features/Dashboard/hooks/use-admin-data-changed";
import { useRealtimeConnectionStatus } from "@/features/Dashboard/hooks/use-realtime-events";
import { employeeScheduleService } from "../services/employee-schedule.service";
import type {
  EmployeeSchedule,
  CreateEmployeeSchedulePayload,
  UpdateEmployeeSchedulePayload,
} from "../types/employee-schedule.types";

export function useEmployeeSchedules(branchId: number | null) {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const realtimeStatus = useRealtimeConnectionStatus(userId);
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSchedules = useCallback(async (silent = false) => {
    if (!branchId) {
      setSchedules([]);
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await employeeScheduleService.getByBranch(branchId);
      setSchedules(data);
      setError("");
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los turnos",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [branchId]);

  useEffect(() => deferEffect(() => void fetchSchedules()), [fetchSchedules]);

  const refreshAfterChange = useCallback(() => {
    void fetchSchedules(true);
  }, [fetchSchedules]);
  useAdminDataChanged(
    userId,
    ["EmployeeSchedules", "Employees"],
    refreshAfterChange,
    refreshAfterChange,
  );

  const createSchedule = async (payload: CreateEmployeeSchedulePayload) => {
    await employeeScheduleService.create(payload);
    if (realtimeStatus !== "connected") await fetchSchedules(true);
  };

  const updateSchedule = async (
    id: number,
    payload: UpdateEmployeeSchedulePayload,
  ) => {
    await employeeScheduleService.update(id, payload);
    if (realtimeStatus !== "connected") await fetchSchedules(true);
  };

  const deleteSchedule = async (id: number) => {
    await employeeScheduleService.remove(id);
    if (realtimeStatus !== "connected") await fetchSchedules(true);
  };

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}
