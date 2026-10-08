"use client";

import { useCallback, useEffect, useState } from "react";
import {
  employeeMeService,
  type MyProfile,
  type UpdateMyProfilePayload,
} from "../services/employee-me.service";

const SESSION_KEY = "sabor-express-session";

// El endpoint /Employees/me responde 401 si el token no trae EmployeeId, y el
// interceptor de axios cerraría la sesión. Por eso se verifica antes de llamar.
function tokenHasEmployeeId(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const token = raw ? JSON.parse(raw)?.token : null;
    if (!token) return false;
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(decodeURIComponent(escape(atob(payload))));
    return Boolean(json.EmployeeId);
  } catch {
    return false;
  }
}

export function useMyProfile(enabled: boolean) {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !tokenHasEmployeeId()) {
      setLoading(false);
      return;
    }
    employeeMeService
      .get()
      .then(setProfile)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "No se pudo cargar tu perfil",
        ),
      )
      .finally(() => setLoading(false));
  }, [enabled]);

  const save = useCallback(
    async (payload: UpdateMyProfilePayload) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await employeeMeService.update({
          // vehicle/plate se reenvían tal cual para no borrarlos al guardar
          vehicle: profile?.vehicle ?? undefined,
          plate: profile?.plate ?? undefined,
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
    [profile],
  );

  return { profile, loading, saving, error, save };
}
