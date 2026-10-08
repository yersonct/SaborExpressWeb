"use client";

import { useCallback, useEffect, useState } from "react";
import { employeeService } from "../services/employee.service";
import type {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  EmployeeStatusFilter,
} from "../types/employee.types";

export function useEmployees(estado: EmployeeStatusFilter = "activo") {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await employeeService.getAll(estado);
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setEmployees(sorted);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los empleados",
      );
    } finally {
      setLoading(false);
    }
  }, [estado]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const createEmployee = async (payload: CreateEmployeePayload) => {
    const result = await employeeService.create(payload);
    await fetchEmployees();
    return result;
  };

  const updateEmployee = async (id: number, payload: UpdateEmployeePayload) => {
    await employeeService.update(id, payload);
    await fetchEmployees();
  };

  const deactivateEmployee = async (id: number) => {
    await employeeService.deactivate(id);
    await fetchEmployees();
  };

  return {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    refetch: fetchEmployees,
  };
}
