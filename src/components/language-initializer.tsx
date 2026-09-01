"use client";

import { useEffect } from "react";
import i18n from "@/config/i18n";

const LANGUAGE_STORAGE_KEY = "sabor-express-language";

export function LanguageInitializer() {
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, []);

  return null;
}
