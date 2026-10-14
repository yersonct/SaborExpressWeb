"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { userSettingsService } from "@/features/Configurations/services/user-settings.service";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { preferenceStorageKey } from "@/config/user-preferences";

const LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

interface LanguageSelectorProps {
  direction?: "up" | "down";
}

export const LanguageSelector = ({
  direction = "up",
}: LanguageSelectorProps) => {
  // Se suscribe al cambio de idioma para actualizar el selector.
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeLanguageCode = (
    i18n.resolvedLanguage || i18n.language || "es"
  ).split(/[-_]/)[0].toLowerCase();
  const currentLang =
    LANGUAGES.find((language) => language.code === activeLanguageCode) ||
    LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = currentLang.code;
  }, [currentLang.code]);

  const changeLanguage = async (code: string) => {
    const language = code as "es" | "en" | "pt" | "fr";
    const languageKey = preferenceStorageKey("language", session?.userId);
    localStorage.setItem(languageKey, language);
    await i18n.changeLanguage(language);
    document.documentElement.lang = language;
    window.dispatchEvent(new CustomEvent("sabor-express-language-changed", {
      detail: { language, userId: session?.userId ?? null },
    }));
    setIsOpen(false);
    try {
      if (session?.token) {
        const updated = await userSettingsService.updateLanguage(language);
        if (localStorage.getItem(languageKey) === language) {
          localStorage.setItem(languageKey, updated.language);
        }
      }
    } catch {
      // La preferencia local queda aplicada aunque el servidor no responda.
    }
  };

  const dropdownPositionClasses =
    direction === "up"
      ? "bottom-full mb-2 slide-in-from-bottom-2"
      : "top-full mt-2 slide-in-from-top-2";

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button" // Evita que el botón intente enviar formularios si está dentro de uno (como en tu Login)
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("languageSelector")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl transition-all duration-200 group shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-white">
            {currentLang.code.toUpperCase()}
          </span>
          <span className="text-xs font-bold text-white transition-colors">
            {currentLang.name}
          </span>
        </div>

        <svg
          className={`w-4 h-4 text-white/80 transition-transform duration-300 ${isOpen && direction === "up" ? "rotate-180" : ""} ${isOpen && direction === "down" ? "-rotate-180" : ""} ${!isOpen && direction === "up" ? "" : ""} ${!isOpen && direction === "down" ? "rotate-180" : ""} ${isOpen ? "text-white" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t("languageSelector")}
          className={`absolute left-0 w-full bg-[#1f2937] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in ${dropdownPositionClasses}`}
        >
          <div className="py-2 flex flex-col">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="menuitemradio"
                aria-checked={currentLang.code === lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all ${
                  currentLang.code === lang.code
                    ? "bg-[#EA1D2C] text-white shadow-sm"
                    : "text-slate-100 hover:bg-[#374151] hover:text-white"
                }`}
              >
                <span className="w-6 rounded bg-white/10 px-1 py-0.5 text-center text-[10px] font-black tracking-wide text-white">
                  {lang.code.toUpperCase()}
                </span>
                <span>{lang.name}</span>
                {currentLang.code === lang.code && (
                  <span className="ml-auto text-white font-black">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
