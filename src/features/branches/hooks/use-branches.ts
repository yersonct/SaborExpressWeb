"use client";

import { useCallback, useEffect, useState } from "react";
import { branchService } from "../services/branch.service";
import type {
  Branch,
  CreateBranchPayload,
  UpdateBranchPayload,
} from "../types/branch.types";

export function useBranches(enabled?: boolean) {
  const isEnabled = enabled === true;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(isEnabled);
  const [error, setError] = useState("");

const fetchBranches = useCallback(async () => {
  if (!isEnabled) {
    setLoading(false);
    return;
  }
  setLoading(true);
  setError("");
  try {
    const data = await branchService.getAll();
    const sorted = [...data].sort((a, b) => b.id - a.id); // más reciente primero
    setBranches(sorted);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "No se pudieron cargar las sedes",
    );
  } finally {
    setLoading(false);
  }
}, [isEnabled]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const createBranch = async (payload: CreateBranchPayload) => {
    await branchService.create(payload);
    await fetchBranches();
  };

  const updateBranch = async (id: number, payload: UpdateBranchPayload) => {
    await branchService.update(id, payload);
    await fetchBranches();
  };

  const deleteBranch = async (id: number) => {
    await branchService.remove(id);
    await fetchBranches();
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
