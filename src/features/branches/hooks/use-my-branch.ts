"use client";

import { useCallback, useEffect, useState } from "react";
import { branchService } from "../services/branch.service";
import type { Branch, UpdateBranchPayload } from "../types/branch.types";

export function useMyBranch(enabled?: boolean) {
  const isEnabled = enabled === true;
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(isEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMyBranch = useCallback(async () => {
    if (!isEnabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await branchService.getMine();
      setBranch(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar tu sede",
      );
    } finally {
      setLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    fetchMyBranch();
  }, [fetchMyBranch]);

  const updateMyBranch = async (payload: UpdateBranchPayload) => {
    if (!branch) return;
    setSaving(true);
    setError("");
    try {
      const updated = await branchService.update(branch.id, payload);
      setBranch(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar la sede",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    branch,
    loading,
    saving,
    error,
    updateMyBranch,
    refetch: fetchMyBranch,
  };
}
