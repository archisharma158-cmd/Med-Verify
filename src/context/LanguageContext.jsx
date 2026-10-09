import { createContext, useContext, useState, useEffect } from "react";
import { translations, SUPPORTED_LANGUAGES } from "../constants/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("medify_user_lang") || "en";
  });

  const setLanguage = (langCode) => {
    setLanguageState(langCode);
    localStorage.setItem("medify_user_lang", langCode);
    document.documentElement.lang = langCode;

    // Dispatch global event so non-React components (e.g. MediBot audio voice) know language changed
    window.dispatchEvent(
      new CustomEvent("medify:language-changed", { detail: { language: langCode } })
    );
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key, fallback = "") => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  const currentLanguageMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageMeta
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
