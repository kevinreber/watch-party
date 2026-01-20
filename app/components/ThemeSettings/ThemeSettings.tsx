import { type CSSProperties } from "react";
import { useTheme } from "~/context/ThemeContext";
import { themeService } from "~/services/themeService";

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSettings({ isOpen, onClose }: ThemeSettingsProps) {
  const { theme, setThemeMode, setAccentColor, toggleSoundEffects, setSoundVolume } = useTheme();

  if (!isOpen) return null;

  const colors = themeService.getAccentColors();

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="theme-settings">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeButton}>
          ✕
        </button>

        <h2 style={styles.title}>Settings</h2>

        {/* Theme Mode */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Theme</h3>
          <div style={styles.modeSelector}>
            <button
              onClick={() => setThemeMode("dark")}
              style={{
                ...styles.modeButton,
                ...(theme.mode === "dark" ? styles.modeButtonActive : {}),
              }}
              data-testid="theme-dark"
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setThemeMode("light")}
              style={{
                ...styles.modeButton,
                ...(theme.mode === "light" ? styles.modeButtonActive : {}),
              }}
              data-testid="theme-light"
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setThemeMode("system")}
              style={{
                ...styles.modeButton,
                ...(theme.mode === "system" ? styles.modeButtonActive : {}),
              }}
              data-testid="theme-system"
            >
              💻 System
            </button>
          </div>
        </div>

        {/* Accent Color */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Accent Color</h3>
          <div style={styles.colorGrid}>
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                style={{
                  ...styles.colorOption,
                  backgroundColor: color.value,
                  border: theme.accentColor === color.value ? "3px solid white" : "none",
                  transform: theme.accentColor === color.value ? "scale(1.1)" : "scale(1)",
                }}
                title={color.name}
                data-testid={`accent-${color.name}`}
              />
            ))}
          </div>
        </div>

        {/* Sound Effects */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Sound Effects</h3>
          <div style={styles.soundToggle}>
            <span style={styles.soundLabel}>
              {theme.soundEffectsEnabled ? "🔔 Enabled" : "🔕 Disabled"}
            </span>
            <button
              onClick={toggleSoundEffects}
              style={{
                ...styles.toggleButton,
                backgroundColor: theme.soundEffectsEnabled ? "#22c55e" : "#404040",
              }}
              data-testid="sound-toggle"
            >
              <div
                style={{
                  ...styles.toggleKnob,
                  transform: theme.soundEffectsEnabled ? "translateX(20px)" : "translateX(0)",
                }}
              />
            </button>
          </div>

          {theme.soundEffectsEnabled && (
            <div style={styles.volumeControl}>
              <span style={styles.volumeLabel}>Volume: {theme.soundVolume}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={theme.soundVolume}
                onChange={(e) => setSoundVolume(Number(e.target.value))}
                style={styles.volumeSlider}
                data-testid="sound-volume"
              />
            </div>
          )}
        </div>

        {/* Preview */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Preview</h3>
          <div style={styles.preview}>
            <button
              style={{
                ...styles.previewButton,
                background: `linear-gradient(135deg, ${theme.accentColor} 0%, ${themeService.adjustBrightness(theme.accentColor, 30)} 100%)`,
              }}
            >
              Primary Button
            </button>
            <div style={styles.previewBadge}>
              <span
                style={{
                  ...styles.previewDot,
                  backgroundColor: theme.accentColor,
                }}
              />
              Sample Badge
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "2rem",
    border: "1px solid #333",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
  closeButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    width: "32px",
    height: "32px",
    border: "none",
    background: "#262626",
    borderRadius: "8px",
    color: "#a3a3a3",
    cursor: "pointer",
    fontSize: "1rem",
  },
  title: {
    margin: "0 0 1.5rem 0",
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  section: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    margin: "0 0 0.75rem 0",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#a3a3a3",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  modeSelector: {
    display: "flex",
    gap: "0.5rem",
  },
  modeButton: {
    flex: 1,
    padding: "0.75rem",
    background: "#262626",
    border: "1px solid #404040",
    borderRadius: "8px",
    color: "#a3a3a3",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  modeButtonActive: {
    background: "#6366f1",
    borderColor: "#6366f1",
    color: "#ffffff",
  },
  colorGrid: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  colorOption: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  soundToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  soundLabel: {
    fontSize: "0.875rem",
    color: "#ffffff",
  },
  toggleButton: {
    position: "relative",
    width: "48px",
    height: "28px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  toggleKnob: {
    position: "absolute",
    top: "4px",
    left: "4px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#ffffff",
    transition: "transform 0.2s ease",
  },
  volumeControl: {
    marginTop: "0.75rem",
  },
  volumeLabel: {
    display: "block",
    fontSize: "0.75rem",
    color: "#a3a3a3",
    marginBottom: "0.5rem",
  },
  volumeSlider: {
    width: "100%",
    accentColor: "#6366f1",
  },
  preview: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    padding: "1rem",
    background: "#262626",
    borderRadius: "8px",
  },
  previewButton: {
    padding: "0.75rem 1rem",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  previewBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    background: "#1a1a1a",
    borderRadius: "100px",
    width: "fit-content",
    fontSize: "0.875rem",
    color: "#ffffff",
  },
  previewDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
};
