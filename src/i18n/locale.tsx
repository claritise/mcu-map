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
 * Reading `window.localStorage` is not safe to do bare.
 *
 * Touching the property THROWS a SecurityError — it does not return null —
 * when storage is blocked: Safari's older private mode, iOS Lockdown Mode,
 * enterprise-managed browsers, and most embedded webviews. Unguarded, that
 * throw came out of an effect during mount, and with no error boundary above
 * it, it took the entire map down to Next's generic crash page for people
 * whose only mistake was a locked-down browser.
 *
 * A remembered language is a nicety. It is never worth the app.
 */
function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "zh" || stored === "en" ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredLocale(next: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage is blocked, or full. The choice still applies for this visit;
    // it just will not survive a reload.
  }
}

/**
 * The locale lives on the client only. Reading localStorage during render would
 * make the server and the first client paint disagree, so the stored choice is
 * applied in an effect and the very first frame is always the default.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored) setLocaleState(stored);
  }, []);

  // Keeps `lang` honest for screen readers and for the font stack in globals.css.
  useEffect(() => {
    document.documentElement.lang =
      LOCALES.find((l) => l.id === locale)?.html ?? "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStoredLocale(next);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
