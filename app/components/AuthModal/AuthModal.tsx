import { useState, type CSSProperties } from "react";
import { useAuth } from "~/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setError("");
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    resetForm();
  };

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="auth-modal">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeButton}>
          ✕
        </button>

        <h2 style={styles.title}>
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>
        <p style={styles.subtitle}>
          {mode === "login"
            ? "Sign in to access your watch parties"
            : "Join to save your watch history and more"
          }
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "register" && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                style={styles.input}
                required
                data-testid="username-input"
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              style={styles.input}
              required
              data-testid="email-input"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={styles.input}
              required
              data-testid="password-input"
            />
          </div>

          {error && <div style={styles.error} data-testid="auth-error">{error}</div>}

          <button
            type="submit"
            style={styles.submitButton}
            disabled={isLoading}
            data-testid="auth-submit"
          >
            {isLoading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={styles.switchMode}>
          <span style={styles.switchText}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button onClick={toggleMode} style={styles.switchButton}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
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
    margin: "0 0 0.5rem 0",
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  subtitle: {
    margin: "0 0 1.5rem 0",
    fontSize: "0.875rem",
    color: "#a3a3a3",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#a3a3a3",
  },
  input: {
    padding: "0.875rem 1rem",
    background: "#262626",
    border: "1px solid #404040",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "1rem",
    outline: "none",
  },
  error: {
    padding: "0.75rem",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    color: "#ef4444",
    fontSize: "0.875rem",
  },
  submitButton: {
    padding: "0.875rem 1.5rem",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  switchMode: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginTop: "1.5rem",
  },
  switchText: {
    fontSize: "0.875rem",
    color: "#737373",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#6366f1",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};
