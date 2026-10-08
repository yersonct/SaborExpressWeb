"use client";

import { useCallback, useEffect, useState } from "react";
import { employeeScheduleService } from "../services/employee-schedule.service";
import type {
  EmployeeSchedule,
  CreateEmployeeSchedulePayload,
  UpdateEmployeeSchedulePayload,
} from "../types/employee-schedule.types";

export function useEmployeeSchedules(branchId: number | null) {
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSchedules = useCallback(async () => {
    if (!branchId) {
      setSchedules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await employeeScheduleService.getByBranch(branchId);
      setSchedules(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los turnos",
      );
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createSchedule = async (payload: CreateEmployeeSchedulePayload) => {
    await employeeScheduleService.create(payload);
    await fetchSchedules();
  };

  const updateSchedule = async (
    id: number,
    payload: UpdateEmployeeSchedulePayload,
  ) => {
    await employeeScheduleService.update(id, payload);
    await fetchSchedules();
  };

  const deleteSchedule = async (id: number) => {
    await employeeScheduleService.remove(id);
    await fetchSchedules();
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
