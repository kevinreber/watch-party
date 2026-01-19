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

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(() => themeService.getThemeSettings());

  useEffect(() => {
    themeService.initializeTheme();
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    const updated = themeService.updateThemeSettings({ mode });
    setTheme(updated);
  }, []);

  const setAccentColor = useCallback((color: string) => {
    const updated = themeService.updateThemeSettings({ accentColor: color });
    setTheme(updated);
  }, []);

  const toggleSoundEffects = useCallback(() => {
    const updated = themeService.updateThemeSettings({
      soundEffectsEnabled: !theme.soundEffectsEnabled
    });
    setTheme(updated);
  }, [theme.soundEffectsEnabled]);

  const setSoundVolume = useCallback((volume: number) => {
    const updated = themeService.updateThemeSettings({ soundVolume: volume });
    setTheme(updated);
  }, []);

  const playSound = useCallback((sound: "join" | "leave" | "message" | "reaction" | "notification") => {
    themeService.playSound(sound);
  }, []);

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
