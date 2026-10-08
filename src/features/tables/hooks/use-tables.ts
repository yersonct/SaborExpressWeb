"use client";

import { useCallback, useEffect, useState } from "react";
import { tableService } from "../services/table.service";
import type { Branch } from "@/features/branches/types/branch.types";
import type {
  Table,
  CreateTablePayload,
  UpdateTablePayload,
  UpdateTableStatusPayload,
} from "../types/table.types";

export function useTables(branchId: number | null, branches: Branch[] = []) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTables = useCallback(async () => {
    // Caso 1: sede específica seleccionada — comportamiento de siempre.
    if (branchId) {
      setLoading(true);
      setError("");
      try {
        const data = await tableService.getByBranch(branchId);
        const sorted = [...data].sort((a, b) => a.number - b.number);
        setTables(sorted);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las mesas",
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // Caso 2: sin sede seleccionada — traer las mesas de TODAS las sedes
    // y combinarlas, ya que cada Table trae su branchName incluido.
    if (branches.length === 0) {
      setTables([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(
        branches.map((b) =>
          tableService.getByBranch(b.id).catch(() => [] as Table[]),
        ),
      );
      const merged = results.flat().sort((a, b) => {
        const branchCompare = (a.branchName ?? "").localeCompare(
          b.branchName ?? "",
        );
        return branchCompare !== 0 ? branchCompare : a.number - b.number;
      });
      setTables(merged);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar las mesas",
      );
    } finally {
      setLoading(false);
    }
  }, [branchId, branches]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createTable = async (payload: CreateTablePayload) => {
    await tableService.create(payload);
    await fetchTables();
  };

  const updateTable = async (id: number, payload: UpdateTablePayload) => {
    await tableService.update(id, payload);
    await fetchTables();
  };

  const updateStatus = async (
    id: number,
    payload: UpdateTableStatusPayload,
  ) => {
    await tableService.updateStatus(id, payload);
    await fetchTables();
  };

  const deleteTable = async (id: number) => {
    await tableService.remove(id);
    await fetchTables();
  };

  return {
    tables,
    loading,
    error,
    createTable,
    updateTable,
    updateStatus,
    deleteTable,
    refetch: fetchTables,
  };
}
