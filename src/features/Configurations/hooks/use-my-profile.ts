"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAdminDataChanged } from "@/features/Dashboard/hooks/use-admin-data-changed";
import {
  employeeMeService,
  type MyProfile,
  type UpdateMyProfilePayload,
} from "../services/employee-me.service";

// El endpoint /Employees/me responde 401 si el token no trae EmployeeId, y el
// interceptor de axios cerraría la sesión. Por eso se verifica antes de llamar.
export function useMyProfile(enabled: boolean) {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !session?.employeeId) {
      await Promise.resolve();
      setLoading(false);
      return;
    }
    try {
      setProfile(await employeeMeService.get());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar tu perfil",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, session?.employeeId]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useAdminDataChanged(
    userId,
    ["Employees", "EmployeeSchedules"],
    () => void load(),
    () => void load(),
  );

  const save = useCallback(
    async (payload: UpdateMyProfilePayload) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await employeeMeService.update({
          ...payload,
        });
        setProfile(updated);
        return updated;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo guardar tu perfil",
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { profile, loading, saving, error, save };
}
