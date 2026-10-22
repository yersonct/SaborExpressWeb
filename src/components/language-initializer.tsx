"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import i18n from "@/config/i18n";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { userSettingsService } from "@/features/Configurations/services/user-settings.service";
import {
  applyTheme,
  isPreferenceLanguage,
  isPreferenceTheme,
  preferenceStorageKey,
} from "@/config/user-preferences";

export function LanguageInitializer() {
  const { session, isHydrated } = useAuth();
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const syncDocumentLanguage = () => {
      const language = (i18n.resolvedLanguage ?? i18n.language ?? "es").split("-")[0];
      const isDigitalMenu = pathname === "/letter" || pathname.startsWith("/letter/");
      const metadataKey = isDigitalMenu ? "letter" : "app";
      document.documentElement.lang = language;
      document.title = i18n.t(`${metadataKey}.title`);
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", i18n.t(`${metadataKey}.description`));
    };

    i18n.on("languageChanged", syncDocumentLanguage);
    syncDocumentLanguage();
    return () => {
      i18n.off("languageChanged", syncDocumentLanguage);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isHydrated) return;

    const userId = session?.userId ?? null;
    const languageKey = preferenceStorageKey("language", userId);
    const themeKey = preferenceStorageKey("theme", userId);
    const savedLanguage = localStorage.getItem(languageKey);
    const savedTheme = localStorage.getItem(themeKey);
    const initialLanguage = isPreferenceLanguage(savedLanguage)
      ? savedLanguage
      : userId === null
        ? (() => {
            const anonymousLanguage = localStorage.getItem(
              preferenceStorageKey("language", null),
            );
            return isPreferenceLanguage(anonymousLanguage) ? anonymousLanguage : null;
          })()
        : null;

    if (initialLanguage) {
      if (userId === null) localStorage.setItem(languageKey, initialLanguage);
      void i18n.changeLanguage(initialLanguage);
      document.documentElement.lang = initialLanguage;
    } else {
      void i18n.changeLanguage("es");
      document.documentElement.lang = "es";
    }
    let currentTheme = isPreferenceTheme(savedTheme) ? savedTheme : "system";
    applyTheme(currentTheme);
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemTheme = () => {
      const latestTheme = localStorage.getItem(themeKey);
      const theme = isPreferenceTheme(latestTheme) ? latestTheme : currentTheme;
      if (theme === "system") applyTheme("system");
    };
    colorScheme.addEventListener("change", applySystemTheme);

    if (!userId || !session) {
      return () => colorScheme.removeEventListener("change", applySystemTheme);
    }
    let active = true;
    Promise.allSettled([
      userSettingsService.getMine(),
      userSettingsService.getLanguage(),
    ]).then(([settings, language]) => {
      if (!active) return;
      if (settings.status === "fulfilled" && isPreferenceTheme(settings.value.theme)) {
        const latestTheme = localStorage.getItem(themeKey);
        if (latestTheme !== savedTheme && isPreferenceTheme(latestTheme)) {
          currentTheme = latestTheme;
          applyTheme(latestTheme);
        } else {
          localStorage.setItem(themeKey, settings.value.theme);
          currentTheme = settings.value.theme;
          applyTheme(settings.value.theme);
        }
      }
      if (language.status === "fulfilled" && isPreferenceLanguage(language.value.language)) {
        const latestLanguage = localStorage.getItem(languageKey);
        if (latestLanguage !== savedLanguage && isPreferenceLanguage(latestLanguage)) {
          void i18n.changeLanguage(latestLanguage);
          document.documentElement.lang = latestLanguage;
        } else {
          localStorage.setItem(languageKey, language.value.language);
          void i18n.changeLanguage(language.value.language);
          document.documentElement.lang = language.value.language;
        }
      }
    });
    return () => {
      active = false;
      colorScheme.removeEventListener("change", applySystemTheme);
    };
  }, [isHydrated, session?.userId, session]);

  return null;
}
