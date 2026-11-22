import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, use, useEffect, useMemo, useState } from "react";
import { resolveThemeColors, type AppThemeColors, type ThemeMode } from "@/theme";

const STORAGE_KEY = "ai_ticket_it_preferences_v1";

interface StoredPreferences {
  theme: ThemeMode;
  colorblind: boolean;
  showMyEventsBtn: boolean;
  defaultMyEventsView: boolean;
}

const DEFAULT_PREFS: StoredPreferences = {
  theme: "light",
  colorblind: false,
  showMyEventsBtn: true,
  defaultMyEventsView: false,
};

interface PreferencesContextValue extends StoredPreferences {
  colors: AppThemeColors;
  isHydrated: boolean;
  setTheme: (theme: ThemeMode) => void;
  setColorblind: (enabled: boolean) => void;
  setShowMyEventsBtn: (visible: boolean) => void;
  setDefaultMyEventsView: (enabled: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<StoredPreferences>(DEFAULT_PREFS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) {
          return;
        }
        const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
        setPrefs({
          theme: parsed.theme === "dark" ? "dark" : "light",
          colorblind: Boolean(parsed.colorblind),
          showMyEventsBtn: parsed.showMyEventsBtn !== undefined ? Boolean(parsed.showMyEventsBtn) : true,
          defaultMyEventsView: Boolean(parsed.defaultMyEventsView),
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setIsHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updatePrefs = (updater: (prev: StoredPreferences) => StoredPreferences) => {
    setPrefs((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const colors = useMemo(
    () => resolveThemeColors(prefs.theme, prefs.colorblind),
    [prefs.theme, prefs.colorblind]
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...prefs,
      colors,
      isHydrated,
      setTheme: (theme) => updatePrefs((p) => ({ ...p, theme })),
      setColorblind: (colorblind) => updatePrefs((p) => ({ ...p, colorblind })),
      setShowMyEventsBtn: (showMyEventsBtn) => updatePrefs((p) => ({ ...p, showMyEventsBtn })),
      setDefaultMyEventsView: (defaultMyEventsView) =>
        updatePrefs((p) => ({ ...p, defaultMyEventsView })),
    }),
    [prefs, colors, isHydrated]
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = use(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences debe usarse dentro de PreferencesProvider");
  }
  return ctx;
}
