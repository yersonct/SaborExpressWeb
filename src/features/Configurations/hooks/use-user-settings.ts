"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  isPreferenceLanguage,
  preferenceStorageKey,
} from "@/config/user-preferences";
import {
  userSettingsService,
  type UpdateUserSettingsPayload,
  type UserLanguage,
  type UserSettings,
} from "../services/user-settings.service";

interface LoadedSettings {
  userId: number;
  settings: UserSettings | null;
  language: UserLanguage;
  error: string | null;
}

function getCachedLanguage(userId: number | null): UserLanguage {
  if (typeof window === "undefined") return "es";
  const saved = localStorage.getItem(preferenceStorageKey("language", userId));
  return isPreferenceLanguage(saved) ? saved : "es";
}

export function useUserSettings() {
  const { session, isHydrated } = useAuth();
  const userId = session?.userId ?? null;
  const [loadedSettings, setLoadedSettings] = useState<LoadedSettings | null>(null);
  const [languageOverrides, setLanguageOverrides] = useState<Record<number, UserLanguage>>({});
  const [saving, setSaving] = useState(false);

  const current = loadedSettings?.userId === userId ? loadedSettings : null;
  const language = userId === null
    ? "es"
    : (languageOverrides[userId] ?? current?.language ?? getCachedLanguage(userId));
  const settings = current?.settings ?? null;
  const error = current?.error ?? null;
  const loading = !isHydrated || (userId !== null && current === null);

  useEffect(() => {
    if (!isHydrated || !userId || !session?.token) return;

    let active = true;
    Promise.allSettled([
      userSettingsService.getMine(),
      userSettingsService.getLanguage(),
    ]).then(([settingsResult, languageResult]) => {
      if (!active) return;

      const savedLanguage = languageResult.status === "fulfilled"
        ? languageResult.value.language
        : getCachedLanguage(userId);
      if (languageResult.status === "fulfilled") {
        localStorage.setItem(
          preferenceStorageKey("language", userId),
          savedLanguage,
        );
        setLanguageOverrides((currentOverrides) => {
          const updatedOverrides = { ...currentOverrides };
          delete updatedOverrides[userId];
          return updatedOverrides;
        });
      }

      setLoadedSettings({
        userId,
        settings: settingsResult.status === "fulfilled" ? settingsResult.value : null,
        language: savedLanguage,
        error: settingsResult.status === "rejected"
          ? settingsResult.reason instanceof Error
            ? settingsResult.reason.message
            : "No se pudieron cargar tus preferencias"
          : null,
      });
    });

    return () => {
      active = false;
    };
  }, [isHydrated, session?.token, userId]);

  useEffect(() => {
    const handleLanguageChanged = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      const nextLanguage =
        typeof detail === "object" && detail !== null && "language" in detail
          ? (detail as { language: unknown; userId?: unknown }).language
          : detail;
      const eventUserId =
        typeof detail === "object" && detail !== null && "userId" in detail
          ? (detail as { userId?: unknown }).userId
          : userId;
      const belongsToCurrentUser =
        eventUserId === null ? userId === null : Number(eventUserId) === userId;

      if (belongsToCurrentUser && isPreferenceLanguage(nextLanguage) && userId) {
        setLanguageOverrides((currentOverrides) => ({
          ...currentOverrides,
          [userId]: nextLanguage,
        }));
      }
    };

    window.addEventListener("sabor-express-language-changed", handleLanguageChanged);
    return () =>
      window.removeEventListener("sabor-express-language-changed", handleLanguageChanged);
  }, [userId]);

  const saveLanguage = useCallback(async (nextLanguage: UserLanguage) => {
    const updated = await userSettingsService.updateLanguage(nextLanguage);
    if (userId) {
      localStorage.setItem(
        preferenceStorageKey("language", userId),
        updated.language,
      );
      setLanguageOverrides((currentOverrides) => ({
        ...currentOverrides,
        [userId]: updated.language,
      }));
    }
    return updated.language;
  }, [userId]);

  const save = useCallback(async (payload: UpdateUserSettingsPayload) => {
    setSaving(true);
    try {
      const updated = await userSettingsService.updateMine(payload);
      if (userId) {
        setLoadedSettings((currentLoaded) => ({
          userId,
          settings: updated,
          language: currentLoaded?.userId === userId
            ? currentLoaded.language
            : getCachedLanguage(userId),
          error: null,
        }));
      }
      return updated;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  return { settings, language, loading, saving, error, save, saveLanguage };
}
