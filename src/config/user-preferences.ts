export type PreferenceLanguage = "es" | "en" | "pt" | "fr";
export type PreferenceTheme = "light" | "dark" | "system";

const SESSION_KEY = "sabor-express-session";

export function preferenceStorageKey(
  preference: "language" | "theme",
  userId: number | string | null | undefined,
) {
  return `sabor-express:${userId ?? "anonymous"}:${preference}`;
}

export function readPreferenceUserId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const userId = (JSON.parse(raw) as { userId?: unknown }).userId;
    if (typeof userId !== "number" && typeof userId !== "string") return null;
    const parsedId = Number(userId);
    return Number.isFinite(parsedId) ? parsedId : null;
  } catch {
    return null;
  }
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
