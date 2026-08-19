"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "zh";

export const LOCALES: { id: Locale; label: string; html: string }[] = [
  { id: "en", label: "EN", html: "en" },
  { id: "zh", label: "中文", html: "zh-Hans" },
];

const STORAGE_KEY = "mcu-map:locale";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (next: Locale) => void;
}>({ locale: "en", setLocale: () => undefined });

/**
 * The locale lives on the client only. Reading localStorage during render would
 * make the server and the first client paint disagree, so the stored choice is
 * applied in an effect and the very first frame is always the default.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "zh" || stored === "en") setLocaleState(stored);
  }, []);

  // Keeps `lang` honest for screen readers and for the font stack in globals.css.
  useEffect(() => {
    document.documentElement.lang =
      LOCALES.find((l) => l.id === locale)?.html ?? "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
