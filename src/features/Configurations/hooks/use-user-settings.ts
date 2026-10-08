"use client";

import { useCallback, useEffect, useState } from "react";
import {
  userSettingsService,
  type UpdateUserSettingsPayload,
  type UserSettings,
} from "../services/user-settings.service";

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userSettingsService
      .getMine()
      .then(setSettings)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar tus preferencias",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (payload: UpdateUserSettingsPayload) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await userSettingsService.updateMine(payload);
      setSettings(updated);
      return updated;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar tus preferencias",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, error, save };
}
