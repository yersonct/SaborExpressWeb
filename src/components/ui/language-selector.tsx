"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18nInstance from "@/config/i18n"; // <- IMPORTACIÓN DIRECTA DE TU ARCHIVO

const LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

const LANGUAGE_STORAGE_KEY = "sabor-express-language"; // 👈 nuevo

interface LanguageSelectorProps {
  direction?: "up" | "down";
}

export const LanguageSelector = ({
  direction = "up",
}: LanguageSelectorProps) => {
  // Solo sacamos "t" del hook para traducir, dejamos a i18n quieto
  const { t } = useTranslation();
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

  // Usamos i18nInstance directo de tu archivo para leer el idioma actual
  const currentLang =
    LANGUAGES.find(
      (l) =>
        l.code ===
        (i18nInstance.resolvedLanguage || i18nInstance.language || "es"),
    ) || LANGUAGES[0];

  const changeLanguage = (code: string) => {
    // Usamos i18nInstance directo de tu archivo para cambiar el idioma
    i18nInstance.changeLanguage(code);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code); // 👈 nuevo
    setIsOpen(false);
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
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111827] hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl transition-all duration-200 group shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">
            {currentLang.flag}
          </span>
          <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
            {currentLang.name}
          </span>
        </div>

        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen && direction === "up" ? "rotate-180" : ""} ${isOpen && direction === "down" ? "-rotate-180" : ""} ${!isOpen && direction === "up" ? "" : ""} ${!isOpen && direction === "down" ? "rotate-180" : ""} ${isOpen ? "text-white" : ""}`}
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
          className={`absolute left-0 w-full bg-[#1f2937] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in ${dropdownPositionClasses}`}
        >
          <div className="py-2 flex flex-col">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all ${
                  currentLang.code === lang.code
                    ? "bg-[#EA1D2C]/10 text-[#EA1D2C]"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLang.code === lang.code && (
                  <span className="ml-auto text-[#EA1D2C] font-black">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
