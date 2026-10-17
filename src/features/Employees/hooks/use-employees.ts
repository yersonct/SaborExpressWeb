"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAdminDataChanged } from "@/features/Dashboard/hooks/use-admin-data-changed";
import { useRealtimeConnectionStatus } from "@/features/Dashboard/hooks/use-realtime-events";
import { employeeService } from "../services/employee.service";
import type {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  EmployeeStatusFilter,
} from "../types/employee.types";

export function useEmployees(estado: EmployeeStatusFilter = "activo") {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const realtimeStatus = useRealtimeConnectionStatus(userId);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Evita que una respuesta antigua reemplace la lista del filtro actual.
  const latestRequestId = useRef(0);

  const fetchEmployees = useCallback(async (silent = false) => {
    const requestId = ++latestRequestId.current;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await employeeService.getAll(estado);
      // Ignorar respuestas de peticiones iniciadas para un filtro anterior.
      if (requestId !== latestRequestId.current) return;
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setEmployees(sorted);
      setError("");
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los empleados",
        );
      }
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  }, [estado]);

  useEffect(() => {
    void fetchEmployees();
    return () => {
      // Invalida peticiones en vuelo al cambiar el filtro o salir de Equipo.
      latestRequestId.current += 1;
    };
  }, [fetchEmployees]);
  const refreshAfterChange = useCallback(() => {
    void fetchEmployees(true);
  }, [fetchEmployees]);
  useAdminDataChanged(
    userId,
    ["Employees", "EmployeeSchedules"],
    refreshAfterChange,
    refreshAfterChange,
  );

  const createEmployee = async (payload: CreateEmployeePayload) => {
    const result = await employeeService.create(payload);
    if (realtimeStatus !== "connected") await fetchEmployees(true);
    return result;
  };

  const updateEmployee = async (id: number, payload: UpdateEmployeePayload) => {
    await employeeService.update(id, payload);
    if (realtimeStatus !== "connected") await fetchEmployees(true);
  };

  const deactivateEmployee = async (id: number) => {
    await employeeService.deactivate(id);
    if (realtimeStatus !== "connected") await fetchEmployees(true);
  };

  const deleteEmployeePermanently = async (id: number) => {
    await employeeService.deletePermanently(id);
    if (realtimeStatus !== "connected") await fetchEmployees(true);
  };

  return {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    deleteEmployeePermanently,
    refetch: fetchEmployees,
  };
}
