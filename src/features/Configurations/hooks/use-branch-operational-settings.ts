"use client";

import { useCallback, useEffect, useState } from "react";
import { branchOperationalSettingsService } from "../services/branch-operational-settings.service";
import type {
  BranchOperationalSettings,
  UpdateBranchOperationalSettingsPayload,
} from "../types/branch-operational-settings.types";

export function useBranchOperationalSettings(branchId: number | null) {
  const [settings, setSettings] = useState<BranchOperationalSettings | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (branchId == null) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSettings(await branchOperationalSettingsService.get(branchId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la configuración de la sede",
      );
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (payload: UpdateBranchOperationalSettingsPayload) => {
      if (branchId == null) return;
      setSaving(true);
      setError(null);
      try {
        const updated = await branchOperationalSettingsService.update(
          branchId,
          payload,
        );
        setSettings(updated);
        return updated;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo guardar la configuración",
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [branchId],
  );

  return { settings, loading, saving, error, save, reload: load };
}
