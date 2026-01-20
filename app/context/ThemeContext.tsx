import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { ThemeSettings, ThemeMode } from "~/types";
import { themeService } from "~/services/themeService";

interface ThemeContextType {
  theme: ThemeSettings;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  toggleSoundEffects: () => void;
  setSoundVolume: (volume: number) => void;
  playSound: (sound: "join" | "leave" | "message" | "reaction" | "notification") => void;
}

// Default theme settings - must match server render
const defaultThemeSettings: ThemeSettings = {
  mode: "dark",
  accentColor: "#6366f1",
  soundEffectsEnabled: true,
  soundVolume: 50,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start with default values to avoid hydration mismatch
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved theme after hydration
  useEffect(() => {
    setIsHydrated(true);
    const savedTheme = themeService.getThemeSettings();
    setTheme(savedTheme);
    themeService.applyTheme(savedTheme);

    // Listen for system theme changes
    if (savedTheme.mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => themeService.applyTheme(savedTheme);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    if (!isHydrated) return;
    const updated = themeService.updateThemeSettings({ mode });
    setTheme(updated);
  }, [isHydrated]);

  const setAccentColor = useCallback((color: string) => {
    if (!isHydrated) return;
    const updated = themeService.updateThemeSettings({ accentColor: color });
    setTheme(updated);
  }, [isHydrated]);

  const toggleSoundEffects = useCallback(() => {
    if (!isHydrated) return;
    const updated = themeService.updateThemeSettings({
      soundEffectsEnabled: !theme.soundEffectsEnabled
    });
    setTheme(updated);
  }, [theme.soundEffectsEnabled, isHydrated]);

  const setSoundVolume = useCallback((volume: number) => {
    if (!isHydrated) return;
    const updated = themeService.updateThemeSettings({ soundVolume: volume });
    setTheme(updated);
  }, [isHydrated]);

  const playSound = useCallback((sound: "join" | "leave" | "message" | "reaction" | "notification") => {
    if (!isHydrated) return;
    themeService.playSound(sound);
  }, [isHydrated]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setThemeMode,
        setAccentColor,
        toggleSoundEffects,
        setSoundVolume,
        playSound,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
