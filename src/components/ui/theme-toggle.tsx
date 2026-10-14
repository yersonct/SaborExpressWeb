"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { applyTheme, preferenceStorageKey } from "@/config/user-preferences";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { userSettingsService } from "@/features/Configurations/services/user-settings.service";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);

  const toggleTheme = () => {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
    localStorage.setItem(
      preferenceStorageKey("theme", session?.userId),
      nextTheme,
    );

    if (saving || !session?.userId) return;

    setSaving(true);
    void (async () => {
      try {
        const currentSettings = await userSettingsService.getMine();
        await userSettingsService.updateMine({
          theme: nextTheme,
          emailNotifications: currentSettings.emailNotifications,
          pushNotifications: currentSettings.pushNotifications,
          soundNotifications: currentSettings.soundNotifications,
          timeZone: currentSettings.timeZone,
        });
      } catch {
        // Keep the selected theme locally if the server is unavailable.
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={saving}
      aria-label={t("appearance.toggleTheme")}
      title={t("appearance.toggleTheme")}
      className="theme-toggle-button disabled:cursor-wait disabled:opacity-60"
    >
      <Moon className="theme-toggle__moon" size={17} aria-hidden="true" />
      <Sun className="theme-toggle__sun" size={17} aria-hidden="true" />
    </button>
  );
}
