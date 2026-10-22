"use client";

import { useCallback, useEffect, useState } from "react";
import { deferEffect } from "@/lib/defer-effect";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAdminDataChanged } from "@/features/Dashboard/hooks/use-admin-data-changed";
import { useRealtimeConnectionStatus } from "@/features/Dashboard/hooks/use-realtime-events";
import { branchService } from "../services/branch.service";
import type {
  Branch,
  CreateBranchPayload,
  UpdateBranchPayload,
} from "../types/branch.types";

export function useBranches(enabled?: boolean) {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const realtimeStatus = useRealtimeConnectionStatus(userId);
  const isEnabled = enabled === true;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(isEnabled);
  const [error, setError] = useState("");

const fetchBranches = useCallback(async (silent = false) => {
  if (!isEnabled) {
    setLoading(false);
    return;
  }
  if (!silent) {
    setLoading(true);
    setError("");
  }
  try {
    const data = await branchService.getAll();
    const sorted = [...data].sort((a, b) => b.id - a.id); // más reciente primero
    setBranches(sorted);
    setError("");
  } catch (err) {
    if (!silent) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar las sedes",
      );
    }
  } finally {
    if (!silent) setLoading(false);
  }
}, [isEnabled]);

  useEffect(() => deferEffect(() => void fetchBranches()), [fetchBranches]);

  const refreshAfterChange = useCallback(() => {
    void fetchBranches(true);
  }, [fetchBranches]);
  useAdminDataChanged(userId, ["Branches"], refreshAfterChange, refreshAfterChange);

  const createBranch = async (payload: CreateBranchPayload) => {
    await branchService.create(payload);
    if (realtimeStatus !== "connected") await fetchBranches(true);
  };

  const updateBranch = async (id: number, payload: UpdateBranchPayload) => {
    await branchService.update(id, payload);
    if (realtimeStatus !== "connected") await fetchBranches(true);
  };

  const deleteBranch = async (id: number) => {
    await branchService.remove(id);
    if (realtimeStatus !== "connected") await fetchBranches(true);
  };

  return {
    branches,
    loading,
    error,
    createBranch,
    updateBranch,
    deleteBranch,
    refetch: fetchBranches,
  };
}
