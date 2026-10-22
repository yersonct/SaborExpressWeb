export type PreferenceLanguage = "es" | "en" | "pt" | "fr";
export type PreferenceTheme = "light" | "dark" | "system";

import { getInMemorySession } from "@/features/auth/session-memory";

export function preferenceStorageKey(
  preference: "language" | "theme",
  userId: number | string | null | undefined,
) {
  return `sabor-express:${userId ?? "anonymous"}:${preference}`;
}

export function readPreferenceUserId(): number | null {
  return getInMemorySession()?.userId ?? null;
}

export function isPreferenceLanguage(value: unknown): value is PreferenceLanguage {
  return value === "es" || value === "en" || value === "pt" || value === "fr";
}

export function isPreferenceTheme(value: unknown): value is PreferenceTheme {
  return value === "light" || value === "dark" || value === "system";
}

export function applyTheme(theme: PreferenceTheme) {
  if (typeof window === "undefined") return;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme =
    theme === "dark" || (theme === "system" && prefersDark) ? "dark" : "light";
}
