"use client";

import { useCallback, useEffect, useState } from "react";
import { deferEffect } from "@/lib/defer-effect";
import { tableService } from "../services/table.service";
import type { Branch } from "@/features/branches/types/branch.types";
import type {
  Table,
  CreateTablePayload,
  UpdateTablePayload,
  UpdateTableStatusPayload,
} from "../types/table.types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useRealtimeConnectionStatus,
  useRealtimeEvents,
} from "@/features/Dashboard/hooks/use-realtime-events";

export function useTables(branchId: number | null, branches: Branch[] = []) {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const realtimeStatus = useRealtimeConnectionStatus(userId);

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // silent = true: recarga en segundo plano, sin esqueleto ni errores en pantalla
  const fetchTables = useCallback(
    async (silent = false) => {
      // Caso 1: sede específica seleccionada
      if (branchId) {
        if (!silent) {
          setLoading(true);
          setError("");
        }
        try {
          const data = await tableService.getByBranch(branchId);
          const sorted = [...data].sort((a, b) => a.number - b.number);
          setTables(sorted);
        } catch (err) {
          if (!silent) {
            setError(
              err instanceof Error
                ? err.message
                : "No se pudieron cargar las mesas",
            );
          }
        } finally {
          if (!silent) setLoading(false);
        }
        return;
      }

      // Caso 2: sin sede — mesas de TODAS las sedes combinadas
      if (branches.length === 0) {
        setTables([]);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
        setError("");
      }
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
        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las mesas",
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [branchId, branches],
  );

  useEffect(() => deferEffect(() => void fetchTables()), [fetchTables]);

  // Tiempo real: el back emite TablesChanged al crear, editar, ocupar, liberar o eliminar
  const refreshImmediately = useCallback(() => {
    void fetchTables(true);
  }, [fetchTables]);

  useRealtimeEvents(
    userId,
    ["TablesChanged"],
    refreshImmediately,
    refreshImmediately,
  );

  const createTable = async (payload: CreateTablePayload) => {
    await tableService.create(payload);
    if (realtimeStatus !== "connected") await fetchTables(true);
  };

  const updateTable = async (id: number, payload: UpdateTablePayload) => {
    await tableService.update(id, payload);
    if (realtimeStatus !== "connected") await fetchTables(true);
  };

  const updateStatus = async (
    id: number,
    payload: UpdateTableStatusPayload,
  ) => {
    await tableService.updateStatus(id, payload);
    if (realtimeStatus !== "connected") await fetchTables(true);
  };

  const deleteTable = async (id: number) => {
    await tableService.remove(id);
    if (realtimeStatus !== "connected") await fetchTables(true);
  };

  return {
    tables,
    loading,
    error,
    createTable,
    updateTable,
    updateStatus,
    deleteTable,
    refetch: () => fetchTables(),
  };
}
