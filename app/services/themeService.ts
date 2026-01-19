// Theme Service
import type { ThemeSettings, ThemeMode } from "~/types";
import { storage, STORAGE_KEYS } from "~/utils/storage";

const defaultThemeSettings: ThemeSettings = {
  mode: "dark",
  accentColor: "#6366f1",
  soundEffectsEnabled: true,
  soundVolume: 50,
};

export const themeService = {
  // Get current theme settings
  getThemeSettings(): ThemeSettings {
    return storage.get<ThemeSettings>(STORAGE_KEYS.THEME_SETTINGS, defaultThemeSettings);
  },

  // Update theme settings
  updateThemeSettings(updates: Partial<ThemeSettings>): ThemeSettings {
    const current = themeService.getThemeSettings();
    const updated = { ...current, ...updates };
    storage.set(STORAGE_KEYS.THEME_SETTINGS, updated);
    themeService.applyTheme(updated);
    return updated;
  },

  // Set theme mode
  setThemeMode(mode: ThemeMode): void {
    themeService.updateThemeSettings({ mode });
  },

  // Set accent color
  setAccentColor(color: string): void {
    themeService.updateThemeSettings({ accentColor: color });
  },

  // Toggle sound effects
  toggleSoundEffects(): boolean {
    const current = themeService.getThemeSettings();
    const updated = themeService.updateThemeSettings({
      soundEffectsEnabled: !current.soundEffectsEnabled
    });
    return updated.soundEffectsEnabled;
  },

  // Set sound volume
  setSoundVolume(volume: number): void {
    themeService.updateThemeSettings({
      soundVolume: Math.max(0, Math.min(100, volume))
    });
  },

  // Apply theme to document
  applyTheme(settings: ThemeSettings): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const { mode, accentColor } = settings;

    // Determine actual mode (handle 'system' preference)
    let actualMode = mode;
    if (mode === "system") {
      actualMode = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    // Apply mode class
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(`theme-${actualMode}`);

    // Apply accent color
    root.style.setProperty("--color-primary", accentColor);

    // Generate hover and dark variants
    const hoverColor = themeService.adjustBrightness(accentColor, 20);
    const darkColor = themeService.adjustBrightness(accentColor, -20);
    root.style.setProperty("--color-primary-hover", hoverColor);
    root.style.setProperty("--color-primary-dark", darkColor);

    // Apply gradient
    root.style.setProperty(
      "--gradient-primary",
      `linear-gradient(135deg, ${accentColor} 0%, ${themeService.adjustBrightness(accentColor, 30)} 100%)`
    );

    // Apply light mode specific colors if needed
    if (actualMode === "light") {
      root.style.setProperty("--color-bg-primary", "#ffffff");
      root.style.setProperty("--color-bg-secondary", "#f5f5f5");
      root.style.setProperty("--color-bg-tertiary", "#e5e5e5");
      root.style.setProperty("--color-text-primary", "#171717");
      root.style.setProperty("--color-text-secondary", "#525252");
      root.style.setProperty("--color-text-muted", "#737373");
      root.style.setProperty("--color-border", "#d4d4d4");
      root.style.setProperty("--color-border-light", "#e5e5e5");
    } else {
      // Reset to dark mode colors
      root.style.setProperty("--color-bg-primary", "#0f0f0f");
      root.style.setProperty("--color-bg-secondary", "#1a1a1a");
      root.style.setProperty("--color-bg-tertiary", "#262626");
      root.style.setProperty("--color-text-primary", "#ffffff");
      root.style.setProperty("--color-text-secondary", "#a3a3a3");
      root.style.setProperty("--color-text-muted", "#737373");
      root.style.setProperty("--color-border", "#333333");
      root.style.setProperty("--color-border-light", "#404040");
    }
  },

  // Adjust color brightness
  adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  },

  // Initialize theme on app load
  initializeTheme(): void {
    const settings = themeService.getThemeSettings();
    themeService.applyTheme(settings);

    // Listen for system theme changes
    if (typeof window !== "undefined" && settings.mode === "system") {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        themeService.applyTheme(settings);
      });
    }
  },

  // Play sound effect
  playSound(sound: "join" | "leave" | "message" | "reaction" | "notification"): void {
    const settings = themeService.getThemeSettings();
    if (!settings.soundEffectsEnabled) return;

    // Sound frequencies for different effects
    const frequencies: Record<string, number[]> = {
      join: [523, 659, 784],      // C, E, G (happy chord)
      leave: [392, 330, 262],     // G, E, C (descending)
      message: [440, 523],         // A, C (notification)
      reaction: [660, 880],        // E, A (positive)
      notification: [440, 550, 660], // Ascending
    };

    if (typeof window !== "undefined" && "AudioContext" in window) {
      try {
        const audioContext = new AudioContext();
        const volume = settings.soundVolume / 100 * 0.3; // Max 30% volume

        frequencies[sound]?.forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = freq;
          oscillator.type = "sine";

          gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

          oscillator.start(audioContext.currentTime + i * 0.1);
          oscillator.stop(audioContext.currentTime + 0.3 + i * 0.1);
        });
      } catch {
        // Audio not supported
      }
    }
  },

  // Available accent colors
  getAccentColors(): Array<{ name: string; value: string }> {
    return [
      { name: "Indigo", value: "#6366f1" },
      { name: "Purple", value: "#8b5cf6" },
      { name: "Pink", value: "#ec4899" },
      { name: "Red", value: "#ef4444" },
      { name: "Orange", value: "#f59e0b" },
      { name: "Green", value: "#22c55e" },
      { name: "Teal", value: "#14b8a6" },
      { name: "Blue", value: "#3b82f6" },
      { name: "Cyan", value: "#06b6d4" },
    ];
  },
};
