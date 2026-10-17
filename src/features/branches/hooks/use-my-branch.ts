"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAdminDataChanged } from "@/features/Dashboard/hooks/use-admin-data-changed";
import { branchService } from "../services/branch.service";
import type { Branch, UpdateBranchPayload } from "../types/branch.types";

export function useMyBranch(enabled?: boolean) {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const isEnabled = enabled === true;
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(isEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMyBranch = useCallback(async (silent = false) => {
    if (!isEnabled) {
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await branchService.getMine();
      setBranch(data);
      setError("");
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : "No se pudo cargar tu sede",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    fetchMyBranch();
  }, [fetchMyBranch]);

  const refreshAfterChange = useCallback(() => {
    void fetchMyBranch(true);
  }, [fetchMyBranch]);
  useAdminDataChanged(userId, ["Branches"], refreshAfterChange, refreshAfterChange);

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
